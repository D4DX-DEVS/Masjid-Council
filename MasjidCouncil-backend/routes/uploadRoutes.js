const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const router = express.Router();

// .env stores the endpoints without a scheme, but the SDK needs a full URL.
const withScheme = (value) => {
    if (!value) return "";
    return /^https?:\/\//.test(value) ? value : `https://${value}`;
};

const MAX_FILE_SIZE = Number(process.env.DO_MAX_FILE_SIZE) || 5 * 1024 * 1024;
const FOLDER = process.env.DO_SPACES_FOLDER || "uploads";
const BUCKET = process.env.DO_SPACES_BUCKET;
const CDN_ENDPOINT = withScheme(process.env.DO_SPACES_CDN_ENDPOINT).replace(/\/$/, "");

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
];

const spaces = new S3Client({
    forcePathStyle: false,
    region: "us-east-1", // DO Spaces ignores the region but the SDK requires one
    endpoint: withScheme(process.env.DO_SPACES_ENDPOINT),
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

// Files go straight to Spaces, so they never touch this server's disk.
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

// POST /upload-files - accepts any field name; responds keyed by field name so each
// form can map the result back to the document it was uploading.
router.post("/upload-files", (req, res) => {
    if (isRateLimited(req.ip)) {
        return res.status(429).json({
            success: false,
            message: "Too many uploads. Please try again later.",
        });
    }

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

        if (!BUCKET || !CDN_ENDPOINT || !process.env.DO_SPACES_KEY) {
            return res.status(500).json({
                success: false,
                message: "File storage is not configured",
            });
        }

        try {
            const data = {};

            for (const file of req.files) {
                const key = buildKey(file);

                await spaces.send(
                    new PutObjectCommand({
                        Bucket: BUCKET,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ACL: "public-read",
                    })
                );

                data[file.fieldname] = {
                    originalName: file.originalname,
                    // DO_SPACES_FOLDER may contain spaces, so the url has to be encoded
                    // even though the S3 key itself stays raw.
                    cdnUrl: `${CDN_ENDPOINT}/${encodeURI(key)}`,
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
});

module.exports = router;
