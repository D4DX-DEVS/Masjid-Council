require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const mosqueAffiliationRoutes = require("./routes/mosqueAffiliationRoutes");
const welfarefundRoutes = require("./routes/welfarefundRoutes");
const mosqueFundRoutes = require("./routes/mosqueFundRoutes");
const khateebRegistrationRoutes = require("./routes/khateebRegistrationRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// const adminRoutes = require("./routes/adminRoutes");

const app = express();

// CORS_ORIGINS="https://masjidcouncil.example,https://admin.masjidcouncil.example"
// Unset means "any origin", which is only acceptable in development.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

if (allowedOrigins.length === 0) {
    console.warn("CORS_ORIGINS is not set — accepting requests from any origin. Set it in production.");
}

// Vite dev servers are allowed outside production so setting the production
// allowlist does not break local work.
const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const allowLocalhost = process.env.NODE_ENV !== "production";

app.use(cors({
    origin: allowedOrigins.length === 0
        ? true
        : (origin, cb) =>
            cb(null, !origin || allowedOrigins.includes(origin) || (allowLocalhost && isLocalhost(origin))),
}));
app.use(express.json());

// MongoDB connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        console.log("Retrying connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

connectDB();

//Routes
// Shared upload endpoint - mounted under both funds so each form keeps its own path.
app.use("/api/mosqueFund", uploadRoutes);
app.use("/api/welfarefund", uploadRoutes);
// Dynamic forms: upload mount must come before submissionRoutes so
// POST /api/submissions/upload-files is not captured by POST /:formType.
app.use("/api/submissions", uploadRoutes);
app.use("/api/form-config", require("./routes/formConfigRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/area", require("./routes/areaRoutes"));
app.use("/api/district", require("./routes/districtRoutes"));

app.use("/api/mosqueAffiliation", mosqueAffiliationRoutes);
app.use("/api/welfarefund", welfarefundRoutes);
app.use("/api/mosqueFund", mosqueFundRoutes);
app.use("/api/khateebRegistration", khateebRegistrationRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/track", require("./routes/trackRoutes"));
app.use("/api/master-data", require("./routes/masterDataRoutes"));
app.use("/api/publications", require("./routes/publicationRoutes"));
app.use("/api/admin-access", require("./routes/adminAccessRoutes"));
// app.use("/api/admin", adminRoutes);

PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

