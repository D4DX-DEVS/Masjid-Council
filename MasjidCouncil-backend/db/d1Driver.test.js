// Runs the app's real Mongoose models through the D1 driver, with Node's built-in SQLite
// standing in for the D1 binding (same engine D1 runs, same JSON functions).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { setBindings } = require("./bindings");

// Minimal D1 surface the driver uses: prepare().bind().all()/first()/run() and batch().
const fakeD1 = (db) => {
  const statement = (sql, params = []) => ({
    bind: (...p) => statement(sql, p),
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    first: async () => db.prepare(sql).get(...params) ?? null,
    run: async () => {
      db.prepare(sql).run(...params);
      return { success: true };
    },
    execSync: () => db.prepare(sql).run(...params),
  });
  return {
    prepare: (sql) => statement(sql),
    batch: async (stmts) => {
      db.exec("BEGIN");
      try {
        for (const s of stmts) s.execSync();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return [];
    },
  };
};

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
setBindings({ DB: fakeD1(sqlite) });

require("./connect");
const mongoose = require("mongoose");
const Admin = require("../models/admin");
const MasterLocation = require("../models/masterLocation");
const Publication = require("../models/publication");
const Submission = require("../models/submission");
const Setting = require("../models/setting");

test("connection reports open", () => {
  assert.strictEqual(mongoose.connection.readyState, 1);
});

test("create runs defaults, timestamps and pre-save hooks; findById round-trips types", async () => {
  const admin = await Admin.create({ username: "alice", password: "secret123", district: "Kozhikode" });
  assert.notStrictEqual(admin.password, "secret123", "bcrypt pre-save hook hashed the password");
  assert.strictEqual(admin.role, "admin", "schema default applied");

  const loaded = await Admin.findById(admin._id);
  assert.ok(loaded._id instanceof mongoose.Types.ObjectId);
  assert.ok(loaded.createdAt instanceof Date);
  assert.strictEqual(await loaded.comparePassword("secret123"), true);
});

test("unique index violations surface as Mongo duplicate-key errors", async () => {
  await assert.rejects(Admin.create({ username: "alice", password: "x" }), (error) => {
    assert.strictEqual(error.code, 11000);
    assert.deepStrictEqual(error.keyPattern, { username: 1 });
    return true;
  });
  // sparse: two admins without a phone number do not collide
  await Admin.create({ username: "bob", password: "x" });
  await Admin.create({ username: "carol", password: "x" });
});

test("save() of a modified document updates in place", async () => {
  const admin = await Admin.findOne({ username: "bob" });
  admin.area = "Feroke";
  await admin.save();
  const again = await Admin.findOne({ username: "bob" }).lean();
  assert.strictEqual(again.area, "Feroke");
  assert.strictEqual(again.__v, 0);
});

test("queries: regex, $in, $or, sort, skip, limit, select, countDocuments, distinct", async () => {
  const district = await MasterLocation.create({ type: "district", title: "KOZHIKODE" });
  await MasterLocation.insertMany([
    { type: "area", title: "Feroke", parent: district._id },
    { type: "area", title: "Beypore", parent: district._id },
    { type: "area", title: "Atholi", parent: district._id, active: false },
  ]);

  const areas = await MasterLocation.find({ type: "area", parent: district._id, active: true })
    .sort({ title: 1 })
    .select("title");
  assert.deepStrictEqual(areas.map((a) => a.title), ["Beypore", "Feroke"]);
  assert.strictEqual(areas[0].type, undefined, "projection dropped unselected fields");

  assert.strictEqual(await MasterLocation.countDocuments({ title: /^b/i }), 1);
  assert.strictEqual(await MasterLocation.countDocuments({ $or: [{ title: "Feroke" }, { active: false }] }), 2);
  const paged = await MasterLocation.find({ type: { $in: ["area"] } }).sort({ title: -1 }).skip(1).limit(1);
  assert.deepStrictEqual(paged.map((a) => a.title), ["Beypore"]);
  assert.deepStrictEqual((await MasterLocation.distinct("type")).sort(), ["area", "district"]);
});

test("compound unique index treats a null parent as a value, like Mongo", async () => {
  await assert.rejects(MasterLocation.create({ type: "district", title: "KOZHIKODE" }), { code: 11000 });
});

test("findOneAndUpdate with upsert and $set, then $push / $pull via updateOne", async () => {
  const created = await Setting.findOneAndUpdate(
    { key: "admin-features" },
    { $set: { value: { banners: true } } },
    { upsert: true, new: true }
  );
  assert.strictEqual(created.key, "admin-features");
  assert.deepStrictEqual(created.value, { banners: true });

  const pub = await Publication.create({ slug: "book", title: "Book", chapters: [] });
  await Publication.updateOne({ _id: pub._id }, { $push: { chapters: { id: 1, slug: "one", title: "One" } } });
  await Publication.updateOne({ _id: pub._id }, { $push: { chapters: { id: 2, slug: "two", title: "Two" } } });
  await Publication.updateOne({ _id: pub._id }, { $pull: { chapters: { slug: "one" } } });
  const after = await Publication.findById(pub._id).lean();
  assert.deepStrictEqual(after.chapters.map((c) => c.slug), ["two"]);
});

test("$elemMatch projection returns only the matching array element", async () => {
  await Publication.create({
    slug: "guide",
    title: "Guide",
    isPublished: true,
    chapters: [
      { id: 1, slug: "intro", title: "Intro", order: 0 },
      { id: 2, slug: "body", title: "Body", order: 1 },
    ],
  });
  const hit = await Publication.findOne({ slug: "guide" }, { chapters: { $elemMatch: { slug: "body" } } });
  assert.strictEqual(hit.chapters.length, 1);
  assert.strictEqual(hit.chapters[0].title, "Body");
  assert.strictEqual(hit.title, undefined);
});

test("aggregate: $match, $group with $sum/$ifNull/$cond/$month", async () => {
  const base = { formVersion: 1, formData: { field_1: "x" } };
  await Submission.insertMany([
    { ...base, formType: "welfarefund", status: "approved", approvedAmount: 100, paidAmount: 100, referenceNumber: "A1" },
    { ...base, formType: "welfarefund", status: "approved", approvedAmount: 50, referenceNumber: "A2" },
    { ...base, formType: "mosquefund", status: "pending", referenceNumber: "A3" },
  ]);
  const rows = await Submission.aggregate([
    { $match: { status: "approved" } },
    {
      $group: {
        _id: "$formType",
        n: { $sum: 1 },
        approved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
        paidCount: { $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] } },
      },
    },
  ]);
  assert.deepStrictEqual(rows, [{ _id: "welfarefund", n: 2, approved: 150, paidCount: 1 }]);

  const monthly = await Submission.aggregate([{ $group: { _id: { $month: "$createdAt" }, n: { $sum: 1 } } }]);
  assert.strictEqual(monthly.reduce((t, r) => t + r.n, 0), 3);
});

test("$elemMatch query on an array of subdocuments", async () => {
  await Submission.create({
    formType: "welfarefund",
    formVersion: 1,
    formData: {},
    referenceNumber: "U1",
    uniqueKeys: [{ fieldId: 7, value: "123412341234" }],
  });
  const dup = await Submission.findOne({ formType: "welfarefund", uniqueKeys: { $elemMatch: { fieldId: 7, value: "123412341234" } } });
  assert.strictEqual(dup.referenceNumber, "U1");
});

test("deletes: findByIdAndDelete and deleteMany", async () => {
  const bob = await Admin.findOne({ username: "bob" });
  const removed = await Admin.findByIdAndDelete(bob._id);
  assert.strictEqual(removed.username, "bob");
  assert.strictEqual(await Admin.findById(bob._id), null);
  const res = await Submission.deleteMany({ formType: "welfarefund" });
  assert.strictEqual(res.deletedCount, 3);
});
