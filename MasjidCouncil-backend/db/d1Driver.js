// A Mongoose driver backed by Cloudflare D1.
//
// The route handlers and models stay plain Mongoose: casting, defaults, validation, hooks,
// populate and lean all run inside Mongoose exactly as before. Only the very bottom layer —
// the calls Mongoose would normally send to the MongoDB driver — is answered here.
//
// Storage: one D1 table per collection, `(_id TEXT PRIMARY KEY, doc TEXT)`, where `doc` is the
// document in relaxed Extended JSON so ObjectIds and Dates survive the round trip. Query
// semantics come from `sift` (the matcher Mongoose itself uses for populate) and aggregation
// from `mingo`. Simple top-level equality filters on scalar schema paths are pushed down into
// SQL as a pre-filter; sift always re-checks the full filter, so pushdown can only narrow the
// candidate set, never change the answer.
//
// The datasets are small (a few thousand documents), which is what makes evaluating the rest
// of the query in the isolate a sound trade.

const MongooseCollection = require("mongoose/lib/collection");
const MongooseConnection = require("mongoose/lib/connection");
const STATES = require("mongoose/lib/connectionState");
const { EJSON, ObjectId } = require("bson");
const sift = require("sift").default;
const mingo = require("mingo");
const { getBinding } = require("./bindings");
const { uniqueIndexes } = require("./indexes");

const DB_BINDING = "DB";
const db = () => getBinding(DB_BINDING);

// ---------------------------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------------------------

const isObjectId = (v) => v != null && typeof v === "object" && v._bsontype === "ObjectId";

// Mongoose hands the driver documents, MongooseArrays, Maps and subdocuments. Reduce all of it
// to plain objects the way the MongoDB driver's BSON serializer would, keeping ObjectIds, Dates
// and RegExps intact. `undefined` becomes null, matching the driver's default
// (ignoreUndefined: false).
const toPlain = (v) => {
  if (v === undefined) return null;
  if (v === null || typeof v !== "object") return v;
  if (v instanceof Date || v instanceof RegExp || v._bsontype) return v;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(v)) return v;
  if (typeof v.toBSON === "function") {
    const bson = v.toBSON();
    if (bson !== v) return toPlain(bson);
  }
  if (v instanceof Map) {
    const out = {};
    for (const [k, x] of v) out[k] = toPlain(x);
    return out;
  }
  if (Array.isArray(v)) return v.map(toPlain);
  const out = {};
  for (const k of Object.keys(v)) out[k] = toPlain(v[k]);
  return out;
};

const serialize = (doc) => EJSON.stringify(doc, { relaxed: true });
const deserialize = (text) => EJSON.parse(text, { relaxed: true });
const clone = (doc) => deserialize(serialize(doc));

// Primary-key text for an _id value. ObjectIds are stored as bare hex so the key stays
// readable in the D1 console; anything else as its EJSON form.
const idKey = (id) => {
  if (isObjectId(id)) return id.toHexString();
  if (typeof id === "string") return id;
  return EJSON.stringify(id, { relaxed: true });
};

// Copy of a value with every ObjectId replaced by its hex string — mingo compares values
// structurally, which would make two equal ObjectIds unequal.
const canon = (v) => {
  if (isObjectId(v)) return v.toHexString();
  if (v === null || typeof v !== "object" || v instanceof Date || v instanceof RegExp) return v;
  if (Array.isArray(v)) return v.map(canon);
  const out = {};
  for (const k of Object.keys(v)) out[k] = canon(v[k]);
  return out;
};

const sameValue = (a, b) => serialize({ v: toPlain(a) }) === serialize({ v: toPlain(b) });

// ---------------------------------------------------------------------------------------------
// Path helpers (dotted paths, numeric segments index into arrays)
// ---------------------------------------------------------------------------------------------

const splitPath = (path) => String(path).split(".");

const getPath = (doc, path) => {
  let cur = doc;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
};

const assertNoPositional = (path) => {
  if (splitPath(path).some((s) => s === "$" || s.startsWith("$["))) {
    throw new Error(`Positional update operator in "${path}" is not supported by the D1 driver`);
  }
};

const setPath = (doc, path, value) => {
  assertNoPositional(path);
  const segs = splitPath(path);
  let cur = doc;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    if (cur[seg] == null || typeof cur[seg] !== "object") {
      cur[seg] = /^\d+$/.test(segs[i + 1]) ? [] : {};
    }
    cur = cur[seg];
  }
  cur[segs[segs.length - 1]] = value;
};

const unsetPath = (doc, path) => {
  assertNoPositional(path);
  const segs = splitPath(path);
  let cur = doc;
  for (let i = 0; i < segs.length - 1; i++) {
    cur = cur?.[segs[i]];
    if (cur == null || typeof cur !== "object") return;
  }
  const last = segs[segs.length - 1];
  if (Array.isArray(cur) && /^\d+$/.test(last)) cur[Number(last)] = null; // Mongo keeps the slot
  else delete cur[last];
};

// ---------------------------------------------------------------------------------------------
// Sorting and projection
// ---------------------------------------------------------------------------------------------

// Mongo's cross-type ordering: null < numbers < strings < objects < arrays < ObjectId < bool < Date
const typeRank = (v) => {
  if (v === undefined || v === null) return 1;
  if (typeof v === "number") return 2;
  if (typeof v === "string") return 3;
  if (isObjectId(v)) return 7;
  if (typeof v === "boolean") return 8;
  if (v instanceof Date) return 9;
  if (Array.isArray(v)) return 5;
  return 4;
};

const compareValues = (a, b) => {
  const ra = typeRank(a);
  const rb = typeRank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 1) return 0;
  if (ra === 7) return a.toHexString() < b.toHexString() ? -1 : a.toHexString() > b.toHexString() ? 1 : 0;
  if (ra === 9) return a.getTime() - b.getTime();
  if (ra === 8) return Number(a) - Number(b);
  if (ra === 2 || ra === 3) return a < b ? -1 : a > b ? 1 : 0;
  const sa = serialize({ v: a });
  const sb = serialize({ v: b });
  return sa < sb ? -1 : sa > sb ? 1 : 0;
};

const normalizeSort = (sort) => {
  if (!sort) return [];
  const entries = sort instanceof Map ? [...sort.entries()] : Array.isArray(sort) ? sort : Object.entries(sort);
  return entries.map(([key, dir]) => {
    const d = typeof dir === "string" ? (/^desc/i.test(dir) || dir === "-1" ? -1 : 1) : Number(dir) < 0 ? -1 : 1;
    return [key, d];
  });
};

const sortDocs = (docs, sort) => {
  const spec = normalizeSort(sort);
  if (spec.length === 0) return docs;
  return docs
    .map((doc, i) => ({ doc, i }))
    .sort((x, y) => {
      for (const [key, dir] of spec) {
        const c = compareValues(getPath(x.doc, key), getPath(y.doc, key));
        if (c !== 0) return c * dir;
      }
      return x.i - y.i;
    })
    .map((x) => x.doc);
};

const isOperatorProjection = (v, op) => v !== null && typeof v === "object" && op in v;
// $slice alone leaves a projection exclusive (every other field kept); $elemMatch counts as
// an inclusion, like Mongo.
const isTruthyProjection = (v) => v === 1 || v === true || isOperatorProjection(v, "$elemMatch");

// Copies `path` from src into dst, mapping over arrays of subdocuments like Mongo does.
const includePath = (src, dst, segs) => {
  const [head, ...rest] = segs;
  if (src == null || typeof src !== "object" || !(head in src)) return;
  const value = src[head];
  if (rest.length === 0) {
    dst[head] = value;
    return;
  }
  if (Array.isArray(value)) {
    const prev = Array.isArray(dst[head]) ? dst[head] : [];
    dst[head] = value
      .map((el, i) => {
        if (el == null || typeof el !== "object" || Array.isArray(el)) return undefined;
        const out = prev[i] && typeof prev[i] === "object" ? prev[i] : {};
        includePath(el, out, rest);
        return out;
      })
      .filter((el) => el !== undefined);
    return;
  }
  if (value == null || typeof value !== "object") return;
  dst[head] = dst[head] && typeof dst[head] === "object" ? dst[head] : {};
  includePath(value, dst[head], rest);
};

const excludePath = (doc, segs) => {
  const [head, ...rest] = segs;
  if (doc == null || typeof doc !== "object") return;
  if (rest.length === 0) {
    delete doc[head];
    return;
  }
  const value = doc[head];
  if (Array.isArray(value)) value.forEach((el) => excludePath(el, rest));
  else excludePath(value, rest);
};

const applyArrayOperators = (src, out, projection) => {
  for (const [k, v] of Object.entries(projection)) {
    if (isOperatorProjection(v, "$elemMatch")) {
      const arr = getPath(src, k);
      const hit = Array.isArray(arr) ? arr.find(sift(v.$elemMatch)) : undefined;
      if (hit === undefined) unsetPath(out, k);
      else setPath(out, k, [hit]);
    } else if (isOperatorProjection(v, "$slice")) {
      const arr = getPath(src, k);
      if (!Array.isArray(arr)) continue;
      const spec = v.$slice;
      const sliced = Array.isArray(spec)
        ? arr.slice(spec[0] < 0 ? Math.max(arr.length + spec[0], 0) : spec[0]).slice(0, spec[1])
        : spec < 0 ? arr.slice(spec) : arr.slice(0, spec);
      setPath(out, k, sliced);
    }
  }
  return out;
};

const project = (doc, projection) => {
  if (!doc || !projection || Object.keys(projection).length === 0) return doc;
  const keys = Object.keys(projection).filter((k) => k !== "_id");
  const inclusive = keys.some((k) => isTruthyProjection(projection[k]));
  const keepId = !(projection._id === 0 || projection._id === false);

  if (inclusive) {
    const out = {};
    if (keepId && "_id" in doc) out._id = doc._id;
    for (const k of keys) if (projection[k] === 1 || projection[k] === true) includePath(doc, out, splitPath(k));
    return applyArrayOperators(doc, out, projection);
  }
  const out = { ...doc };
  if (!keepId) delete out._id;
  for (const k of keys) if (!isOperatorProjection(projection[k], "$slice")) excludePath(out, splitPath(k));
  return applyArrayOperators(doc, out, projection);
};

// ---------------------------------------------------------------------------------------------
// Update operators
// ---------------------------------------------------------------------------------------------

const isOperatorUpdate = (update) => Object.keys(update || {}).some((k) => k.startsWith("$"));

const each = (value) => (value && typeof value === "object" && Array.isArray(value.$each) ? value.$each : [value]);

const applyUpdate = (doc, rawUpdate, { isInsert = false } = {}) => {
  if (Array.isArray(rawUpdate)) throw new Error("Update pipelines are not supported by the D1 driver");
  const update = toPlain(rawUpdate);

  if (!isOperatorUpdate(update)) {
    return { ...update, _id: doc._id };
  }

  for (const [op, fields] of Object.entries(update)) {
    for (const [path, value] of Object.entries(fields || {})) {
      switch (op) {
        case "$set":
          setPath(doc, path, value);
          break;
        case "$setOnInsert":
          if (isInsert) setPath(doc, path, value);
          break;
        case "$unset":
          unsetPath(doc, path);
          break;
        case "$inc":
          setPath(doc, path, (Number(getPath(doc, path)) || 0) + Number(value));
          break;
        case "$mul":
          setPath(doc, path, (Number(getPath(doc, path)) || 0) * Number(value));
          break;
        case "$min": {
          const cur = getPath(doc, path);
          if (cur === undefined || compareValues(value, cur) < 0) setPath(doc, path, value);
          break;
        }
        case "$max": {
          const cur = getPath(doc, path);
          if (cur === undefined || compareValues(value, cur) > 0) setPath(doc, path, value);
          break;
        }
        case "$currentDate":
          setPath(doc, path, new Date());
          break;
        case "$rename": {
          const cur = getPath(doc, path);
          if (cur !== undefined) {
            unsetPath(doc, path);
            setPath(doc, value, cur);
          }
          break;
        }
        case "$push": {
          const arr = Array.isArray(getPath(doc, path)) ? getPath(doc, path) : [];
          const items = each(value);
          const position = value && typeof value === "object" && Number.isInteger(value.$position) ? value.$position : null;
          if (position === null) arr.push(...items);
          else arr.splice(position, 0, ...items);
          let result = arr;
          if (value && typeof value === "object" && Number.isInteger(value.$slice)) {
            result = value.$slice < 0 ? arr.slice(value.$slice) : arr.slice(0, value.$slice);
          }
          setPath(doc, path, result);
          break;
        }
        case "$addToSet": {
          const arr = Array.isArray(getPath(doc, path)) ? getPath(doc, path) : [];
          for (const item of each(value)) if (!arr.some((x) => sameValue(x, item))) arr.push(item);
          setPath(doc, path, arr);
          break;
        }
        case "$pull": {
          const arr = getPath(doc, path);
          if (!Array.isArray(arr)) break;
          const test = value !== null && typeof value === "object" && !(value instanceof Date) && !isObjectId(value)
            ? sift(value)
            : (el) => sameValue(el, value);
          setPath(doc, path, arr.filter((el) => !test(el)));
          break;
        }
        case "$pullAll": {
          const arr = getPath(doc, path);
          if (!Array.isArray(arr)) break;
          setPath(doc, path, arr.filter((el) => !value.some((v) => sameValue(el, v))));
          break;
        }
        case "$pop": {
          const arr = getPath(doc, path);
          if (!Array.isArray(arr)) break;
          setPath(doc, path, Number(value) < 0 ? arr.slice(1) : arr.slice(0, -1));
          break;
        }
        default:
          throw new Error(`Update operator ${op} is not supported by the D1 driver`);
      }
    }
  }
  return doc;
};

// Seed for an upsert: the filter's plain equality conditions, the way Mongo builds one.
const upsertSeed = (filter) => {
  const seed = {};
  for (const [key, value] of Object.entries(filter || {})) {
    if (key.startsWith("$")) continue;
    if (value instanceof RegExp) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && !isObjectId(value) && !(value instanceof Date)) {
      const keys = Object.keys(value);
      if (keys.some((k) => k.startsWith("$"))) {
        if ("$eq" in value) setPath(seed, key, toPlain(value.$eq));
        continue;
      }
    }
    setPath(seed, key, toPlain(value));
  }
  return seed;
};

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------

// Translate a D1 unique-index violation into the MongoServerError shape the routes check for
// (`code === 11000`, `keyPattern`, `keyValue`).
const toDuplicateKeyError = (error, collectionName, doc) => {
  const message = String(error && error.message);
  if (!/UNIQUE constraint failed/i.test(message)) return error;

  let keyPattern = { _id: 1 };
  const named = /index '([^']+)'/.exec(message);
  if (named) {
    const idx = (uniqueIndexes[collectionName] || []).find((i) => i.name === named[1]);
    if (idx) keyPattern = idx.key;
  }
  const keyValue = {};
  for (const k of Object.keys(keyPattern)) keyValue[k] = doc ? getPath(doc, k) : undefined;

  const dup = new Error(
    `E11000 duplicate key error collection: ${collectionName} dup key: ${JSON.stringify(canon(keyValue))}`
  );
  dup.name = "MongoServerError";
  dup.code = 11000;
  dup.keyPattern = keyPattern;
  dup.keyValue = keyValue;
  return dup;
};

// ---------------------------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------------------------

const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;
const jsonPath = (path) => "$" + splitPath(path).map((s) => `."${s.replace(/"/g, '\\"')}"`).join("");

const SCALAR_INSTANCES = new Set(["String", "Number", "Boolean", "ObjectId"]);

function D1Collection(name, conn, options) {
  this.Promise = (options && options.Promise) || Promise;
  this.modelName = options && options.modelName;
  if (options) delete options.modelName;
  MongooseCollection.apply(this, arguments);
}

Object.setPrototypeOf(D1Collection.prototype, MongooseCollection.prototype);

D1Collection.prototype._table = function _table() {
  return quoteIdent(this.name);
};

D1Collection.prototype._schema = function _schema() {
  const model = this.modelName && this.conn && this.conn.models && this.conn.models[this.modelName];
  return model ? model.schema : null;
};

// Builds a SQL pre-filter from the parts of `filter` that can be checked exactly in SQLite.
D1Collection.prototype._pushdown = function _pushdown(filter) {
  const clauses = [];
  const params = [];
  const schema = this._schema();

  for (const [key, raw] of Object.entries(filter || {})) {
    if (key.startsWith("$")) continue;
    const value = raw && typeof raw === "object" && !isObjectId(raw) && !(raw instanceof Date) && !(raw instanceof RegExp) &&
      !Array.isArray(raw) && Object.keys(raw).length === 1 && "$eq" in raw ? raw.$eq : raw;

    if (key === "_id") {
      if (isObjectId(value) || typeof value === "string") {
        clauses.push("_id = ?");
        params.push(idKey(value));
      } else if (value && typeof value === "object" && Array.isArray(value.$in) && Object.keys(value).length === 1 &&
        value.$in.length > 0 && value.$in.length <= 90 && value.$in.every((v) => isObjectId(v) || typeof v === "string")) {
        clauses.push(`_id IN (${value.$in.map(() => "?").join(", ")})`);
        params.push(...value.$in.map(idKey));
      }
      continue;
    }

    const type = schema && schema.path(key) && schema.path(key).instance;
    if (!type || !SCALAR_INSTANCES.has(type)) continue;

    if (value === null) {
      clauses.push("json_extract(doc, ?) IS NULL");
      params.push(jsonPath(key));
    } else if (type === "ObjectId" && isObjectId(value)) {
      clauses.push("json_extract(doc, ?) = ?");
      params.push(jsonPath(key) + '."$oid"', value.toHexString());
    } else if (type === "String" && typeof value === "string") {
      clauses.push("json_extract(doc, ?) = ?");
      params.push(jsonPath(key), value);
    } else if (type === "Number" && typeof value === "number" && Number.isFinite(value)) {
      clauses.push("json_extract(doc, ?) = ?");
      params.push(jsonPath(key), value);
    } else if (type === "Boolean" && typeof value === "boolean") {
      clauses.push("json_extract(doc, ?) = ?");
      params.push(jsonPath(key), value ? 1 : 0);
    }
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
};

// All documents matching `filter`, in natural (insertion) order.
D1Collection.prototype._match = async function _match(filter) {
  const { where, params } = this._pushdown(filter);
  const { results } = await db()
    .prepare(`SELECT doc FROM ${this._table()} ${where} ORDER BY rowid`)
    .bind(...params)
    .all();
  const docs = results.map((r) => deserialize(r.doc));
  if (!filter || Object.keys(filter).length === 0) return docs;
  return docs.filter(sift(filter));
};

D1Collection.prototype._query = async function _query(filter, options = {}) {
  let docs = sortDocs(await this._match(filter), options.sort);
  if (options.skip) docs = docs.slice(Number(options.skip));
  if (options.limit) docs = docs.slice(0, Math.abs(Number(options.limit)));
  return docs;
};

D1Collection.prototype._insertRows = async function _insertRows(docs) {
  const stmts = docs.map((doc) =>
    db().prepare(`INSERT INTO ${this._table()} (_id, doc) VALUES (?, ?)`).bind(idKey(doc._id), serialize(doc))
  );
  for (let i = 0; i < stmts.length; i += 50) {
    try {
      await db().batch(stmts.slice(i, i + 50));
    } catch (error) {
      throw toDuplicateKeyError(error, this.name, docs[i]);
    }
  }
};

D1Collection.prototype._writeRows = async function _writeRows(docs) {
  const stmts = docs.map((doc) =>
    db().prepare(`UPDATE ${this._table()} SET doc = ? WHERE _id = ?`).bind(serialize(doc), idKey(doc._id))
  );
  for (let i = 0; i < stmts.length; i += 50) {
    try {
      await db().batch(stmts.slice(i, i + 50));
    } catch (error) {
      throw toDuplicateKeyError(error, this.name, docs[i]);
    }
  }
};

D1Collection.prototype._deleteRows = async function _deleteRows(docs) {
  const stmts = docs.map((doc) => db().prepare(`DELETE FROM ${this._table()} WHERE _id = ?`).bind(idKey(doc._id)));
  for (let i = 0; i < stmts.length; i += 50) await db().batch(stmts.slice(i, i + 50));
};

const cursorOf = (promiseFactory) => ({
  toArray: () => promiseFactory(),
  explain: async () => ({ driver: "d1" }),
  close: async () => {},
});

D1Collection.prototype.find = function find(filter, options = {}) {
  return cursorOf(async () => {
    const docs = await this._query(filter, options);
    return docs.map((d) => project(d, options.projection));
  });
};

D1Collection.prototype.findOne = async function findOne(filter, options = {}) {
  const [doc] = await this._query(filter, { ...options, limit: 1 });
  return doc ? project(doc, options.projection) : null;
};

D1Collection.prototype.countDocuments = async function countDocuments(filter, options = {}) {
  if (!filter || Object.keys(filter).length === 0) {
    if (!options.skip && !options.limit) return this.estimatedDocumentCount();
  }
  return (await this._query(filter, { skip: options.skip, limit: options.limit })).length;
};

D1Collection.prototype.estimatedDocumentCount = async function estimatedDocumentCount() {
  const row = await db().prepare(`SELECT COUNT(*) AS n FROM ${this._table()}`).first();
  return row ? Number(row.n) : 0;
};

D1Collection.prototype.distinct = async function distinct(field, filter) {
  const out = [];
  for (const doc of await this._match(filter)) {
    const value = getPath(doc, field);
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v === undefined) continue;
      if (!out.some((x) => sameValue(x, v))) out.push(v);
    }
  }
  return out;
};

D1Collection.prototype.insertOne = async function insertOne(doc) {
  const plain = toPlain(doc);
  if (plain._id == null) plain._id = new ObjectId();
  await this._insertRows([plain]);
  return { acknowledged: true, insertedId: plain._id };
};

D1Collection.prototype.insertMany = async function insertMany(docs) {
  const plain = docs.map((d) => {
    const p = toPlain(d);
    if (p._id == null) p._id = new ObjectId();
    return p;
  });
  await this._insertRows(plain);
  const insertedIds = {};
  plain.forEach((p, i) => {
    insertedIds[i] = p._id;
  });
  return { acknowledged: true, insertedCount: plain.length, insertedIds };
};

D1Collection.prototype._upsert = async function _upsert(filter, update) {
  const seed = upsertSeed(filter);
  if (seed._id == null) seed._id = new ObjectId();
  const doc = applyUpdate(seed, update, { isInsert: true });
  if (doc._id == null) doc._id = seed._id;
  await this._insertRows([doc]);
  return doc;
};

D1Collection.prototype._update = async function _update(filter, update, options, many) {
  const matches = many ? await this._match(filter) : await this._query(filter, { sort: options.sort, limit: 1 });
  if (matches.length === 0) {
    if (!options.upsert) return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null };
    const doc = await this._upsert(filter, update);
    return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: doc._id };
  }
  const changed = [];
  for (const doc of matches) {
    const before = serialize(doc);
    const after = applyUpdate(clone(doc), update);
    if (serialize(after) !== before) changed.push(after);
  }
  if (changed.length) await this._writeRows(changed);
  return { acknowledged: true, matchedCount: matches.length, modifiedCount: changed.length, upsertedCount: 0, upsertedId: null };
};

D1Collection.prototype.updateOne = function updateOne(filter, update, options = {}) {
  return this._update(filter, update, options, false);
};

D1Collection.prototype.updateMany = function updateMany(filter, update, options = {}) {
  return this._update(filter, update, options, true);
};

D1Collection.prototype.replaceOne = function replaceOne(filter, replacement, options = {}) {
  if (isOperatorUpdate(replacement)) throw new Error("replaceOne() takes a replacement document, not operators");
  return this._update(filter, replacement, options, false);
};

const wantsAfter = (options) =>
  options.returnDocument === "after" || options.returnOriginal === false || options.new === true;

const withMetadata = (options, value, lastErrorObject) =>
  options.includeResultMetadata ? { value, ok: 1, lastErrorObject } : value;

D1Collection.prototype._findAndModify = async function _findAndModify(filter, update, options = {}) {
  const [doc] = await this._query(filter, { sort: options.sort, limit: 1 });
  if (!doc) {
    if (!options.upsert) return withMetadata(options, null, { n: 0, updatedExisting: false });
    const created = await this._upsert(filter, update);
    const value = wantsAfter(options) ? project(created, options.projection) : null;
    return withMetadata(options, value, { n: 1, updatedExisting: false, upserted: created._id });
  }
  const after = applyUpdate(clone(doc), update);
  if (serialize(after) !== serialize(doc)) await this._writeRows([after]);
  const value = project(wantsAfter(options) ? after : doc, options.projection);
  return withMetadata(options, value, { n: 1, updatedExisting: true });
};

D1Collection.prototype.findOneAndUpdate = function findOneAndUpdate(filter, update, options = {}) {
  return this._findAndModify(filter, update, options);
};

D1Collection.prototype.findOneAndReplace = function findOneAndReplace(filter, replacement, options = {}) {
  if (isOperatorUpdate(replacement)) throw new Error("findOneAndReplace() takes a replacement document");
  return this._findAndModify(filter, replacement, options);
};

D1Collection.prototype.findOneAndDelete = async function findOneAndDelete(filter, options = {}) {
  const [doc] = await this._query(filter, { sort: options.sort, limit: 1 });
  if (!doc) return withMetadata(options, null, { n: 0 });
  await this._deleteRows([doc]);
  return withMetadata(options, project(doc, options.projection), { n: 1 });
};

D1Collection.prototype.deleteOne = async function deleteOne(filter) {
  const [doc] = await this._query(filter, { limit: 1 });
  if (doc) await this._deleteRows([doc]);
  return { acknowledged: true, deletedCount: doc ? 1 : 0 };
};

D1Collection.prototype.deleteMany = async function deleteMany(filter) {
  const docs = await this._match(filter);
  if (docs.length) await this._deleteRows(docs);
  return { acknowledged: true, deletedCount: docs.length };
};

D1Collection.prototype.aggregate = function aggregate(pipeline) {
  return cursorOf(async () => {
    const first = pipeline[0] && pipeline[0].$match;
    const docs = await this._match(first || {});
    const rest = first ? pipeline.slice(1) : pipeline;
    return mingo.aggregate(docs.map(canon), canon(rest));
  });
};

D1Collection.prototype.bulkWrite = async function bulkWrite(ops) {
  const res = { insertedCount: 0, matchedCount: 0, modifiedCount: 0, deletedCount: 0, upsertedCount: 0, insertedIds: {}, upsertedIds: {} };
  for (const [i, op] of ops.entries()) {
    if (op.insertOne) {
      const r = await this.insertOne(op.insertOne.document);
      res.insertedCount += 1;
      res.insertedIds[i] = r.insertedId;
    } else if (op.updateOne || op.updateMany || op.replaceOne) {
      const spec = op.updateOne || op.updateMany || op.replaceOne;
      const r = await this._update(spec.filter, spec.update || spec.replacement, { upsert: spec.upsert }, Boolean(op.updateMany));
      res.matchedCount += r.matchedCount;
      res.modifiedCount += r.modifiedCount;
      res.upsertedCount += r.upsertedCount;
      if (r.upsertedId) res.upsertedIds[i] = r.upsertedId;
    } else if (op.deleteOne) {
      res.deletedCount += (await this.deleteOne(op.deleteOne.filter)).deletedCount;
    } else if (op.deleteMany) {
      res.deletedCount += (await this.deleteMany(op.deleteMany.filter)).deletedCount;
    }
  }
  return { ...res, ok: 1, isOk: () => true, hasWriteErrors: () => false, getWriteErrors: () => [] };
};

// Indexes live in db/schema.sql and are applied by migration; Mongoose's autoIndex is off.
D1Collection.prototype.createIndex = async function createIndex() {
  return "noop";
};
D1Collection.prototype.createIndexes = async function createIndexes() {
  return [];
};
D1Collection.prototype.dropIndex = async function dropIndex() {};
D1Collection.prototype.dropIndexes = async function dropIndexes() {};
D1Collection.prototype.listIndexes = function listIndexes() {
  return cursorOf(async () => []);
};
D1Collection.prototype.indexes = async function indexes() {
  return [];
};
D1Collection.prototype.indexInformation = async function indexInformation() {
  return {};
};

// ---------------------------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------------------------

function D1Connection() {
  MongooseConnection.apply(this, arguments);
}

Object.setPrototypeOf(D1Connection.prototype, MongooseConnection.prototype);

D1Connection.STATES = STATES;

D1Connection.prototype.createClient = async function createClient(uri) {
  this._connectionString = uri;
  this.name = "d1";
  this.db = { databaseName: "d1" };
  this.client = null;
  this.onOpen();
  return this;
};

D1Connection.prototype.doClose = async function doClose() {
  return this;
};

D1Connection.prototype.listCollections = async function listCollections() {
  const { results } = await db()
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")
    .all();
  return results.map((r) => ({ name: r.name, type: "collection" }));
};

D1Connection.prototype.useDb = function useDb() {
  return this;
};

module.exports = {
  Collection: D1Collection,
  Connection: D1Connection,
  BulkWriteResult: function BulkWriteResult() {},
  // exported for tests
  _internals: { toPlain, project, applyUpdate, sortDocs, upsertSeed, serialize, deserialize, idKey, jsonPath },
};
