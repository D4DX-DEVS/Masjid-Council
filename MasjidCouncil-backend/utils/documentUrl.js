// The application forms are public, so anything posted to /create is attacker-controlled.
// Stored document urls end up in an admin's <a href>, where a `javascript:` value would run
// on click - so only accept urls our own upload endpoint could have produced.

const withScheme = (value) => {
    if (!value) return "";
    return /^https?:\/\//.test(value) ? value : `https://${value}`;
};

// Public base url of the R2 uploads bucket, as served by this Worker's /files route.
const FILES_PUBLIC_URL = withScheme(process.env.FILES_PUBLIC_URL).replace(/\/$/, "");

const isUploadedDocumentUrl = (value) => {
    if (typeof value !== "string" || value.length === 0) return false;
    if (FILES_PUBLIC_URL) return value.startsWith(`${FILES_PUBLIC_URL}/`);
    // No public url configured (local dev): fall back to a plain scheme allowlist.
    return /^https?:\/\//i.test(value);
};

module.exports = { isUploadedDocumentUrl, FILES_PUBLIC_URL };
