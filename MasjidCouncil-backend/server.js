require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const mosqueAffiliationRoutes = require("./routes/mosqueAffiliationRoutes");
const welfarefundRoutes = require("./routes/welfarefundRoutes");
const mosqueFundRoutes = require("./routes/mosqueFundRoutes");
const khateebRegistrationRoutes = require("./routes/khateebRegistrationRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
});

const fileFilter = (req, file, cb) => {
    // Check if file is PDF
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.use("/api/mosqueAffiliation", mosqueAffiliationRoutes);
app.use("/api/welfarefund", welfarefundRoutes);
app.use("/api/mosqueFund", mosqueFundRoutes);
app.use("/api/khateebRegistration", khateebRegistrationRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/track", require("./routes/trackRoutes"));
app.use("/api/master-data", require("./routes/masterDataRoutes"));
// app.use("/api/admin", adminRoutes);

PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

