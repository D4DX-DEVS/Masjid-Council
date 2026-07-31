const express = require("express");
const router = express.Router();
const mosqueAffiliation = require("../models/mosqueAffiliation");
const externalApiService = require("../services/externalApiService");

// CREATE - Add a new mosque affiliation
router.post("/create", async (req, res) => {
  try {
    console.log("Received form data:", req.body);

    // Generate affiliation number using timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const affiliationNumber = `MAF${timestamp}${randomSuffix}`;

    // Map form data to schema structure
    const mappedData = {
      affiliationNumber: affiliationNumber,
      name: req.body.mosqueName || "",
      mosqueType: req.body.mosqueAddress || "",
      mahallaType: req.body.localityAddress || "",
      establishedYear: parseInt(req.body.yearStarted) || new Date().getFullYear(),
      address: [{
        address: req.body.completeAddress || "",
        district: req.body.district || "",
        pincode: parseInt(req.body.pincode) || 0,
        phone: parseInt(req.body.phone) || 0,
        email: req.body.email || "",
        website: req.body.website || "",
      }],
      jamathArea: [{
        area: req.body.area || "",
        district: req.body.jamaatDistrict || "",
      }],
      facilities: req.body.facilities || [],
      hasCemetery: req.body.hasCemetery === "ഉണ്ട്",
      mosqueCapacity: req.body.specialtyDescription || "",
      mosqueArea: req.body.category || "",
      fridayMaleAttendance: req.body.menCount || "0",
      fridayFemaleAttendance: req.body.womenCount || "0",
      finance: [{
        assets: req.body.financialAssets || "",
        incomeSource: req.body.incomeSource || "",
        monthlyExpense: req.body.monthlyExpenses || "",
      }],
      audit: [{
        hasAudit: req.body.maintainsAccounts === "ഉണ്ട്",
        recordsKept: req.body.recordsKept || [],
      }],
      accounts: [{
        lastYearIncome: req.body.totalIncome || "0",
        lastYearExpense: req.body.totalExpense || "0",
      }],
      commmunityServices: req.body.communityServices || [],
      otherCommunityServices: req.body.otherServices ? [req.body.otherServices] : [],
      committees: [{
        committeeType: req.body.committeeType || "",
        president: [{
          name: req.body.president?.name || "",
          phone: req.body.president?.mobile || "",
          email: req.body.president?.email || "",
        }],
        secretary: [{
          name: req.body.secretary?.name || "",
          phone: req.body.secretary?.mobile || "",
          email: req.body.secretary?.email || "",
        }],
        workers: req.body.staff?.map((staff) => ({
          age: staff.age || "",
          salary: staff.salary || "",
          qualification: staff.qualification || "",
          remarks: staff.remarks || "",
          working: staff.work || "",
          otherStateWorkers: req.body.hasOutstateStaff === "ഉണ്ട്",
          LegalOtherStateWorkers: req.body.followsOutstateProcedures === "ഉണ്ട്",
        })) || [],
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Mapped data:", mappedData);

    const newMosqueAffiliation = new mosqueAffiliation(mappedData);
    const savedMosqueAffiliation = await newMosqueAffiliation.save();

    return res.status(201).json({
      success: true,
      message: "Mosque affiliation created successfully with affiliation number: " + savedMosqueAffiliation.affiliationNumber,
      data: savedMosqueAffiliation,
    });
  } catch (error) {
    console.error("Error creating mosque affiliation:", error);
    res.status(400).json({
      success: false,
      message: "Error creating mosque affiliation",
      error: error.message,
    });
  }
});

// READ ALL - Get all mosque affiliations
router.get("/all", async (req, res) => {
  try {
    const mosqueAffiliations = await mosqueAffiliation.find();
    res.status(200).json({
      success: true,
      message: "Mosque affiliations retrieved successfully",
      count: mosqueAffiliations.length,
      data: mosqueAffiliations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving mosque affiliations",
      error: error.message,
    });
  }
});

// GET BY AFFILIATION NUMBER - Get a specific mosque affiliation by affiliation number
router.get("/affiliation/:affiliationNumber", async (req, res) => {
  try {
    const mosqueAffiliationData = await mosqueAffiliation.findOne({
      affiliationNumber: req.params.affiliationNumber,
    });
    if (!mosqueAffiliationData) {
      return res.status(404).json({
        success: false,
        message: "Mosque affiliation not found with this affiliation number",
      });
    }
    res.status(200).json({
      success: true,
      message: "Mosque affiliation retrieved successfully",
      data: mosqueAffiliationData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving mosque affiliation",
      error: error.message,
    });
  }
});

// UPDATE BY AFFILIATION NUMBER - Update a mosque affiliation by affiliation number
router.put("/affiliation/:affiliationNumber", async (req, res) => {
  try {
    const updatedMosqueAffiliation = await mosqueAffiliation.findOneAndUpdate(
      { affiliationNumber: req.params.affiliationNumber },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMosqueAffiliation) {
      return res.status(404).json({
        success: false,
        message: "Mosque affiliation not found with this affiliation number",
      });
    }
    res.status(200).json({
      success: true,
      message: "Mosque affiliation updated successfully",
      data: updatedMosqueAffiliation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating mosque affiliation",
      error: error.message,
    });
  }
});

// READ ONE - Get a specific mosque affiliation by ID
router.get("/:id", async (req, res) => {
  try {
    const mosqueAffiliationData = await mosqueAffiliation.findById(
      req.params.id
    );
    if (!mosqueAffiliationData) {
      return res.status(404).json({
        success: false,
        message: "Mosque affiliation not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Mosque affiliation retrieved successfully",
      data: mosqueAffiliationData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving mosque affiliation",
      error: error.message,
    });
  }
});

// UPDATE - Update a mosque affiliation by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedMosqueAffiliation = await mosqueAffiliation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMosqueAffiliation) {
      return res.status(404).json({
        success: false,
        message: "Mosque affiliation not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Mosque affiliation updated successfully",
      data: updatedMosqueAffiliation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating mosque affiliation",
      error: error.message,
    });
  }
});

// DELETE - Delete a mosque affiliation by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedMosqueAffiliation = await mosqueAffiliation.findByIdAndDelete(
      req.params.id
    );
    if (!deletedMosqueAffiliation) {
      return res.status(404).json({
        success: false,
        message: "Mosque affiliation not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Mosque affiliation deleted successfully",
      data: deletedMosqueAffiliation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting mosque affiliation",
      error: error.message,
    });
  }
});

// EXTERNAL API ROUTES - Fetch district, area, and unit details

// Get all districts from external API
router.get("/external/districts", async (req, res) => {
  try {
    const result = await externalApiService.getAllDistricts();
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Districts retrieved successfully from external API",
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching districts from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching districts",
      error: error.message,
    });
  }
});

// Get specific district details from external API
router.get("/external/districts/:districtId", async (req, res) => {
  try {
    const result = await externalApiService.getDistrictDetails(
      req.params.districtId
    );
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "District details retrieved successfully from external API",
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching district details from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching district details",
      error: error.message,
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
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching areas from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching areas",
      error: error.message,
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
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching area details from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching area details",
      error: error.message,
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
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching units from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching units",
      error: error.message,
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
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching unit details from external API",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unit details",
      error: error.message,
    });
  }
});

module.exports = router;
