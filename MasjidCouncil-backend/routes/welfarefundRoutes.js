const express = require("express");
const router = express.Router();
const welfarefund = require("../models/welfarefund");
const externalApiService = require("../services/externalApiService");

// CREATE - Add a new welfare fund application
router.post("/create", async (req, res) => {
    try {
        // Validate required fields
        const {
            mosqueName,
            mckAffiliation,
            address,
            committeePerson,
            managementType,
            phone,
            area,
            district,
            applicantDetails,
            helpPurpose,
            needDescription,
            expectedExpense,
            mosquePresident,
            mosquePhone
        } = req.body;

        // Check for required fields
        if (!mosqueName || !mckAffiliation || !address || !committeePerson || 
            !managementType || !phone || !area || !district || !applicantDetails || 
            !helpPurpose || !needDescription || !expectedExpense || 
            !mosquePresident || !mosquePhone) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        const newWelfareFund = new welfarefund(req.body);
        const savedWelfareFund = await newWelfareFund.save();
        
        res.status(201).json({
            success: true,
            message: "Welfare fund application submitted successfully",
            data: savedWelfareFund
        });
    } catch (error) {
        console.error("Error creating welfare fund application:", error);
        res.status(400).json({
            success: false,
            message: "Error creating welfare fund application",
            error: error.message
        });
    }
});

// READ ALL - Get all welfare fund applications
router.get("/all", async (req, res) => {
    try {
        const welfareFunds = await welfarefund.find();
        res.status(200).json({
            success: true,
            message: "Welfare fund applications retrieved successfully",
            count: welfareFunds.length,
            data: welfareFunds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving welfare fund applications",
            error: error.message
        });
    }
});

// READ ONE - Get a specific welfare fund application by ID
router.get("/:id", async (req, res) => {
    try {
        const welfareFundData = await welfarefund.findById(req.params.id);
        if (!welfareFundData) {
            return res.status(404).json({
                success: false,
                message: "Welfare fund application not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Welfare fund application retrieved successfully",
            data: welfareFundData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving welfare fund application",
            error: error.message
        });
    }
});

// UPDATE - Update a welfare fund application by ID
router.put("/:id", async (req, res) => {
    try {
        const updatedWelfareFund = await welfarefund.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedWelfareFund) {
            return res.status(404).json({
                success: false,
                message: "Welfare fund application not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Welfare fund application updated successfully",
            data: updatedWelfareFund
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating welfare fund application",
            error: error.message
        });
    }
});

// DELETE - Delete a welfare fund application by ID
router.delete("/:id", async (req, res) => {
    try {
        const deletedWelfareFund = await welfarefund.findByIdAndDelete(req.params.id);
        if (!deletedWelfareFund) {
            return res.status(404).json({
                success: false,
                message: "Welfare fund application not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Welfare fund application deleted successfully",
            data: deletedWelfareFund
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting welfare fund application",
            error: error.message
        });
    }
});

// EXTERNAL API ROUTES - Fetch district, area, and unit details for welfare fund

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