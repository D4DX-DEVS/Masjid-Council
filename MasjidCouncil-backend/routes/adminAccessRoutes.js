const express = require("express");
const { authenticateAdmin, authenticateSuperAdmin } = require("../middleware/auth");
const { FEATURES, getFeatureAccess, setFeatureAccess } = require("../lib/featureAccess");

const router = express.Router();

// Read: any admin console needs this to decide which sidebar entries to draw. The state admin
// reads its own effective access; the super admin reads what it has granted.
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const access = await getFeatureAccess();
    res.json({
      success: true,
      // The super admin is never subject to the switch, so its own effective access is always
      // full — `access` is what state admins get, `effective` is what this caller gets.
      data: access,
      effective:
        req.user.role === "superadmin"
          ? Object.fromEntries(Object.keys(FEATURES).map((k) => [k, true]))
          : access,
      features: Object.fromEntries(
        Object.entries(FEATURES).map(([key, meta]) => [key, { label: meta.label }])
      ),
    });
  } catch (error) {
    console.error("Get admin feature access error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Write: super admin only. A state admin must not be able to grant itself access.
router.put("/", authenticateSuperAdmin, async (req, res) => {
  try {
    const access = await setFeatureAccess(req.body);
    res.json({ success: true, data: access });
  } catch (error) {
    console.error("Update admin feature access error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
