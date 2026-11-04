const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { authenticateAdmin } = require("../middleware/auth");
const { requireFeature } = require("../lib/featureAccess");
const { FILES_PUBLIC_URL } = require("../utils/documentUrl");
const { putObject, isStorageConfigured } = require("../lib/fileStorage");

const router = express.Router();

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const FOLDER = process.env.UPLOAD_FOLDER || "uploads";

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
];

// Files go straight to R2, so they never touch this server's disk.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
        cb(new Error("Only PDF, JPEG, PNG, GIF and WEBP files are allowed"));
    },
});

const buildKey = (file) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    return `${FOLDER}/${file.fieldname}-${unique}${ext}`;
};

// The application forms are public, so this endpoint cannot require a login. Cap how much
// one client can push into the bucket instead.
// ponytail: in-memory counter, fine for a single instance - swap for redis/express-rate-limit
// if this ever runs behind more than one process.
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxUploads: 20 };
const uploadsByIp = new Map();

const isRateLimited = (ip) => {
    const now = Date.now();
    const hits = (uploadsByIp.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);

    if (hits.length >= RATE_LIMIT.maxUploads) {
        uploadsByIp.set(ip, hits);
        return true;
    }

    hits.push(now);
    uploadsByIp.set(ip, hits);

    // Drop clients that fell out of the window so the map cannot grow forever.
    for (const [key, times] of uploadsByIp) {
        if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) uploadsByIp.delete(key);
    }

    return false;
};

// Accepts any field name; responds keyed by field name so each form can map the result
// back to the document it was uploading.
const handleUpload = (req, res) => {
    upload.any()(req, res, async (uploadError) => {
        if (uploadError) {
            // Drain whatever multer left unread, otherwise the client sees a reset
            // connection instead of this error response.
            req.unpipe();
            req.resume();
            return res.status(400).json({
                success: false,
                message: uploadError.message,
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No file received",
            });
        }

        if (!FILES_PUBLIC_URL || !isStorageConfigured()) {
            return res.status(500).json({
                success: false,
                message: "File storage is not configured",
            });
        }

        try {
            const data = {};

            for (const file of req.files) {
                const key = buildKey(file);

                await putObject(key, file.buffer, file.mimetype);

                data[file.fieldname] = {
                    originalName: file.originalname,
                    // UPLOAD_FOLDER may contain spaces, so the url has to be encoded
                    // even though the object key itself stays raw.
                    cdnUrl: `${FILES_PUBLIC_URL}/${encodeURI(key)}`,
                    key,
                };
            }

            res.status(201).json({
                success: true,
                message: "File uploaded successfully",
                data,
            });
        } catch (error) {
            console.error("File upload error:", error);
            res.status(500).json({
                success: false,
                message: "Error uploading file",
                error: error.message,
            });
        }
    });
};

// POST /upload-files - public, because the application forms are public. Capped per IP.
router.post("/upload-files", (req, res) => {
    if (isRateLimited(req.ip)) {
        return res.status(429).json({
            success: false,
            message: "Too many uploads. Please try again later.",
        });
    }
    handleUpload(req, res);
});

// POST /upload-admin-files - same storage, no IP cap. An admin laying out a publication
// chapter can legitimately paste a dozen images in a minute, which the public limit of 20
// per 10 minutes would block. Safe to lift only because the login gates it.
//
// Guarded by the publications flag because the publications editor is its only caller: when
// the super admin blocks that feature, a state admin must not keep an uncapped write into the
// bucket through its back door. Anything else needing admin uploads should get its own route
// with its own guard rather than widening this one.
router.post(
    "/upload-admin-files",
    authenticateAdmin,
    requireFeature("publications"),
    handleUpload
);

// POST /upload-submission-file - an admin replacing an attachment on a submission they
// are correcting. Its own route rather than a widening of upload-admin-files: that one
// belongs to the publications editor and is switched off with it, and a form correction
// must not depend on whether publications happen to be enabled. No IP cap, for the same
// reason as above - the admin login is the gate.
// POST /upload-banner-file - the banners page. Its own route for the same reason as above:
// switching banners off for state admins must close this, and must not touch publications.
router.post(
    "/upload-banner-file",
    authenticateAdmin,
    requireFeature("banners"),
    handleUpload
);

// POST /upload-homepage-file - images for the home page customiser, closed with that feature.
router.post(
    "/upload-homepage-file",
    authenticateAdmin,
    requireFeature("homepage"),
    handleUpload
);

router.post("/upload-submission-file", authenticateAdmin, handleUpload);

module.exports = router;
