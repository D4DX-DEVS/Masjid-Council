// The application forms are public, so anything posted to /create is attacker-controlled.
// Stored document urls end up in an admin's <a href>, where a `javascript:` value would run
// on click - so only accept urls our own upload endpoint could have produced.

const withScheme = (value) => {
    if (!value) return "";
    return /^https?:\/\//.test(value) ? value : `https://${value}`;
};

const CDN_ENDPOINT = withScheme(process.env.DO_SPACES_CDN_ENDPOINT).replace(/\/$/, "");

const isUploadedDocumentUrl = (value) => {
    if (typeof value !== "string" || value.length === 0) return false;
    if (CDN_ENDPOINT) return value.startsWith(`${CDN_ENDPOINT}/`);
    // No CDN configured (local dev): fall back to a plain scheme allowlist.
    return /^https?:\/\//i.test(value);
};

module.exports = { isUploadedDocumentUrl };
