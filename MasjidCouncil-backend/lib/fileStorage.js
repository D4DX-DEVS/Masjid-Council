// Uploaded files live in the Cloudflare R2 bucket bound to the Worker as UPLOADS. The Worker
// entry (src/worker.mjs) serves them back publicly under /files/<key>.

const { getBinding } = require("../db/bindings");

const BUCKET_BINDING = "UPLOADS";

// Keys embed a timestamp and random suffix, so an object never changes once written.
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

const isStorageConfigured = () => {
    try {
        return Boolean(getBinding(BUCKET_BINDING));
    } catch {
        return false;
    }
};

const putObject = (key, body, contentType) =>
    getBinding(BUCKET_BINDING).put(key, body, {
        httpMetadata: { contentType, cacheControl: IMMUTABLE_CACHE },
    });

module.exports = { putObject, isStorageConfigured, IMMUTABLE_CACHE };
