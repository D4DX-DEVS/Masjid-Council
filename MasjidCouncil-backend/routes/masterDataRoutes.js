const express = require("express");
const MasterLocation = require("../models/masterLocation");
const externalApiService = require("../services/externalApiService");
const { authenticateAdmin, authenticateSuperAdmin } = require("../middleware/auth");

const router = express.Router();

const isJunk = (title) => !title || /^\s*test\s*$/i.test(title);
const rows = (result) => (result.success ? result.data?.data || [] : []);

// ---------- public reads (the forms use these) ----------

const listByParent = (type) => async (req, res) => {
  try {
    const filter = { type, active: true };
    if (type !== "district") filter.parent = req.params.parentId;

    const items = await MasterLocation.find(filter).sort({ title: 1 });
    res.json({
      success: true,
      [`${type}s`]: items.map((i) => ({
        id: i._id,
        title: i.title,
        name: i.title,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get("/districts", listByParent("district"));
router.get("/areas/:parentId", listByParent("area"));
router.get("/units/:parentId", listByParent("unit"));

// ---------- admin management ----------

// Full tree for the setup page (includes inactive rows)
router.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const items = await MasterLocation.find().sort({ type: 1, title: 1 });
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const { type, title, parent } = req.body;
    if (!type || !title) {
      return res
        .status(400)
        .json({ success: false, message: "type and title are required" });
    }
    if (type !== "district" && !parent) {
      return res
        .status(400)
        .json({ success: false, message: "parent is required for area/unit" });
    }

    const item = await MasterLocation.create({
      type,
      title: title.trim(),
      parent: type === "district" ? null : parent,
    });
    res.status(201).json({ success: true, item });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Already exists under this parent" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { title, active } = req.body;
    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (active !== undefined) update.active = active;

    const item = await MasterLocation.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, item });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Already exists under this parent" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Deleting a district/area would orphan its children, so remove them too
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const item = await MasterLocation.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const childIds = await MasterLocation.find({ parent: item._id }).distinct("_id");
    await MasterLocation.deleteMany({ parent: { $in: childIds } });
    await MasterLocation.deleteMany({ parent: item._id });
    await item.deleteOne();

    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------- import from the external unit API ----------

// Upsert by externalId so re-running only adds what is new and renames what changed.
router.post("/import", authenticateSuperAdmin, async (req, res) => {
  try {
    const counts = { districts: 0, areas: 0, units: 0, skipped: 0 };

    const upsert = async (type, row, parentId) => {
      if (isJunk(row.title)) {
        counts.skipped += 1;
        return null;
      }
      const doc = await MasterLocation.findOneAndUpdate(
        { externalId: row._id },
        { type, title: row.title.trim(), parent: parentId, externalId: row._id },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      counts[`${type}s`] += 1;
      return doc;
    };

    const districts = rows(await externalApiService.getAllDistricts());
    if (!districts.length) {
      return res.status(502).json({
        success: false,
        message: "External API returned no districts; nothing imported",
      });
    }

    for (const district of districts) {
      const districtDoc = await upsert("district", district, null);
      if (!districtDoc) continue;

      const areas = rows(await externalApiService.getAreasByDistrict(district._id));
      for (const area of areas) {
        const areaDoc = await upsert("area", area, districtDoc._id);
        if (!areaDoc) continue;

        const units = rows(await externalApiService.getUnitsByArea(area._id));
        for (const unit of units) {
          await upsert("unit", unit, areaDoc._id);
        }
      }
    }

    res.json({ success: true, message: "Import complete", counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
