const express = require("express");
const router = express.Router();
const khateebRegistration = require("../models/khateebRegistration");
const { authenticateAdmin } = require("../middleware/auth");

// TEST ROUTE
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Khateeb Registration API is working!",
        timestamp: new Date().toISOString()
    });
});

// CREATE - Add a new khateeb registration
router.post("/create", async (req, res) => {
    try {
        const requiredFields = ["fullName", "phone", "masjidName", "mahallu", "district", "khutbaRegular", "movementRelation", "attending"];
        const missing = requiredFields.filter((field) => !req.body[field]);
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: " + missing.join(", ")
            });
        }

        const registrationData = {
            fullName: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email || "",
            masjidName: req.body.masjidName,
            mahallu: req.body.mahallu,
            area: req.body.area || "",
            district: req.body.district,
            khutbaRegular: req.body.khutbaRegular,
            movementRelation: req.body.movementRelation,
            attending: req.body.attending,
            notAttendingReason: req.body.attending === "no" ? (req.body.notAttendingReason || "") : "",
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const saved = await new khateebRegistration(registrationData).save();

        res.status(201).json({
            success: true,
            message: "Khateeb registration submitted successfully",
            data: saved
        });
    } catch (error) {
        console.error("Error creating khateeb registration:", error);
        res.status(400).json({
            success: false,
            message: "Error submitting khateeb registration",
            error: error.message
        });
    }
});

// READ ALL
router.get("/all", authenticateAdmin, async (req, res) => {
    try {
        const registrations = await khateebRegistration.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Khateeb registrations retrieved successfully",
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving khateeb registrations",
            error: error.message
        });
    }
});

// READ ONE
router.get("/:id", authenticateAdmin, async (req, res) => {
    try {
        const registration = await khateebRegistration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Khateeb registration not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Khateeb registration retrieved successfully",
            data: registration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving khateeb registration",
            error: error.message
        });
    }
});

// UPDATE (also used by admin / super admin for status changes)
router.put("/:id", authenticateAdmin, async (req, res) => {
    try {
        const updated = await khateebRegistration.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Khateeb registration not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Khateeb registration updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating khateeb registration",
            error: error.message
        });
    }
});

// DELETE
router.delete("/:id", authenticateAdmin, async (req, res) => {
    try {
        const deleted = await khateebRegistration.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Khateeb registration not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Khateeb registration deleted successfully",
            data: deleted
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting khateeb registration",
            error: error.message
        });
    }
});

module.exports = router;
