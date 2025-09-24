const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const mosqueFund = require("../models/mosqueFund");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const externalApiService = require("../services/externalApiService");

// Configure multer for file uploads (if needed in future)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/');
        // Ensure directory exists
        if (!require('fs').existsSync(uploadPath)) {
            require('fs').mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
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

// TEST ROUTE - Simple test endpoint
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Mosque Fund API is working!",
        timestamp: new Date().toISOString()
    });
});

// CREATE - Add a new mosque fund request
router.post("/create", async (req, res) => {
    try {
        console.log("Received mosque fund form data:", req.body);

        // Validate required declarations
        if (!req.body.declaration1 || !req.body.declaration2) {
            return res.status(400).json({
                success: false,
                message: "Both declarations must be accepted"
            });
        }

        // Map form data to schema structure
        const mosqueFundData = {
            mosqueName: req.body.mosqueName || "",
            mckAffiliation: req.body.mckAffiliation || "",
            address: req.body.address || "",
            managementType: req.body.managementType || "",
            presidentSecretary: req.body.presidentSecretary || "",
            jamathIslami: req.body.jamathIslami || "",
            phone: req.body.phone || "",
            area: req.body.area || "",
            district: req.body.district || "",
            
            // Help Status
            mckFundService: req.body.mckFundService || "",
            previousHelp: req.body.previousHelp || "",
            
            // Current Help Details
            helpPurpose: req.body.helpPurpose || "",
            needDescription: req.body.needDescription || "",
            expectedExpense: req.body.expectedExpense || "",
            ownContribution: req.body.ownContribution || "",
            
            // Contact Details
            mosqueOfficialName: req.body.mosqueOfficialName || "",
            mosqueOfficialPhone: req.body.mosqueOfficialPhone || "",
            whatsappNumber: req.body.whatsappNumber || "",
            
            // Bank Details
            bankPassbook: req.body.bankPassbook || "",
            fullEstimate: req.body.fullEstimate || "",
            
            // Declarations
            declaration1: req.body.declaration1 === true || req.body.declaration1 === 'true',
            declaration2: req.body.declaration2 === true || req.body.declaration2 === 'true',
            
            // Default status
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log("Mapped mosque fund data:", mosqueFundData);

        // Try MongoDB first, fallback to file storage
        try {
            if (mongoose.connection.readyState === 1) {
                const newMosqueFund = new mosqueFund(mosqueFundData);
                const savedMosqueFund = await newMosqueFund.save();
                console.log("Saved mosque fund to MongoDB successfully:", savedMosqueFund);
                
                return res.status(201).json({
                    success: true,
                    message: "Mosque fund application submitted successfully",
                    data: savedMosqueFund,
                });
            } else {
                throw new Error("MongoDB not connected");
            }
        } catch (dbError) {
            console.log("MongoDB failed, using file storage:", dbError.message);
            
            // Fallback to file storage
            const filePath = path.join(__dirname, '../data/mosqueFunds.json');
            let mosqueFunds = [];
            
            try {
                const fileData = await fs.readFile(filePath, 'utf8');
                mosqueFunds = JSON.parse(fileData);
            } catch (fileError) {
                console.log("Creating new mosque funds file");
                mosqueFunds = [];
            }
            
            // Add unique ID for file storage
            mosqueFundData._id = Date.now().toString();
            mosqueFunds.push(mosqueFundData);
            await fs.writeFile(filePath, JSON.stringify(mosqueFunds, null, 2));
            
            console.log("Saved mosque fund to file successfully");
            
            return res.status(201).json({
                success: true,
                message: "Mosque fund application submitted successfully",
                data: mosqueFundData,
            });
        }
    } catch (error) {
        console.error("Error creating mosque fund request:", error);
        res.status(400).json({
            success: false,
            message: "Error submitting mosque fund application",
            error: error.message,
        });
    }
});

// READ ALL - Get all mosque fund requests
router.get("/all", async (req, res) => {
    try {
        const mosqueFunds = await mosqueFund.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Mosque fund requests retrieved successfully",
            count: mosqueFunds.length,
            data: mosqueFunds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving mosque fund requests",
            error: error.message
        });
    }
});

// READ ONE - Get a specific mosque fund request by ID
router.get("/:id", async (req, res) => {
    try {
        const mosqueFundData = await mosqueFund.findById(req.params.id);

        if (!mosqueFundData) {
            return res.status(404).json({
                success: false,
                message: "Mosque fund request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mosque fund request retrieved successfully",
            data: mosqueFundData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving mosque fund request",
            error: error.message
        });
    }
});

// UPDATE - Update a mosque fund request by ID
router.put("/:id", async (req, res) => {
    try {
        const existingFund = await mosqueFund.findById(req.params.id);
        if (!existingFund) {
            return res.status(404).json({
                success: false,
                message: "Mosque fund request not found"
            });
        }

        // Update data with new values
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        // Handle boolean conversions for declarations
        if (updateData.declaration1 !== undefined) {
            updateData.declaration1 = updateData.declaration1 === true || updateData.declaration1 === 'true';
        }
        if (updateData.declaration2 !== undefined) {
            updateData.declaration2 = updateData.declaration2 === true || updateData.declaration2 === 'true';
        }

        const updatedMosqueFund = await mosqueFund.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Mosque fund request updated successfully",
            data: updatedMosqueFund
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating mosque fund request",
            error: error.message
        });
    }
});

// DELETE - Delete a mosque fund request by ID
router.delete("/:id", async (req, res) => {
    try {
        const mosqueFundData = await mosqueFund.findById(req.params.id);
        if (!mosqueFundData) {
            return res.status(404).json({
                success: false,
                message: "Mosque fund request not found"
            });
        }

        const deletedMosqueFund = await mosqueFund.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Mosque fund request deleted successfully",
            data: deletedMosqueFund
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting mosque fund request",
            error: error.message
        });
    }
});

// GET BY STATUS - Get mosque fund requests by status
router.get("/status/:status", async (req, res) => {
    try {
        const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
        if (!validStatuses.includes(req.params.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Valid statuses are: " + validStatuses.join(', ')
            });
        }

        const mosqueFundData = await mosqueFund.find({ 
            status: req.params.status 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: `Mosque fund requests with status '${req.params.status}' retrieved successfully`,
            count: mosqueFundData.length,
            data: mosqueFundData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving mosque fund requests",
            error: error.message
        });
    }
});

// GET BY AFFILIATION NUMBER - Get mosque fund requests by affiliation number
router.get("/affiliation/:affiliationNumber", async (req, res) => {
    try {
        const mosqueFundData = await mosqueFund.find({ 
            mckAffiliation: req.params.affiliationNumber 
        }).sort({ createdAt: -1 });

        if (!mosqueFundData || mosqueFundData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No mosque fund requests found with this affiliation number"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mosque fund requests retrieved successfully",
            count: mosqueFundData.length,
            data: mosqueFundData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving mosque fund requests",
            error: error.message
        });
    }
});

// EXTERNAL API ROUTES - Fetch district, area, and unit details for mosque fund

// Get all districts from external API
router.get("/external/districts", async (req, res) => {
    try {
        const result = await externalApiService.getAllDistricts();
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Districts retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching districts from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching districts",
            error: error.message
        });
    }
});

// Get specific district details from external API
router.get("/external/districts/:districtId", async (req, res) => {
    try {
        const result = await externalApiService.getDistrictDetails(req.params.districtId);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "District details retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching district details from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching district details",
            error: error.message
        });
    }
});

// Get all areas from external API
router.get("/external/areas", async (req, res) => {
    try {
        const result = await externalApiService.getAllAreas();
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Areas retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching areas from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching areas",
            error: error.message
        });
    }
});

// Get specific area details from external API
router.get("/external/areas/:areaId", async (req, res) => {
    try {
        const result = await externalApiService.getAreaDetails(req.params.areaId);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Area details retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching area details from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching area details",
            error: error.message
        });
    }
});

// Get all units from external API
router.get("/external/units", async (req, res) => {
    try {
        const result = await externalApiService.getAllUnits();
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Units retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching units from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching units",
            error: error.message
        });
    }
});

// Get specific unit details from external API
router.get("/external/units/:unitId", async (req, res) => {
    try {
        const result = await externalApiService.getUnitDetails(req.params.unitId);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Unit details retrieved successfully from external API",
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Error fetching unit details from external API",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching unit details",
            error: error.message
        });
    }
});

module.exports = router; 
