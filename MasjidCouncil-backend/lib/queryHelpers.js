// Shared query-building guards. Everything that reaches a Mongo query from
// req.query / req.body goes through here first.

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Express' extended query parser turns ?district[$ne]=x into an object, which
// Mongo would happily treat as an operator. Force every user value to a string.
const str = (value) => (value === undefined || value === null ? "" : String(value)).trim();

// district / area are stored as free text with inconsistent casing (master data
// says "Kozhikode", the area-admin CSV says "KOZHIKODE") — match exactly but case-blind.
const exactCI = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

// Safe "contains" search — the raw term would otherwise be a user-supplied regex.
const containsCI = (value) => new RegExp(escapeRegex(value), "i");

module.exports = { escapeRegex, str, exactCI, containsCI };
