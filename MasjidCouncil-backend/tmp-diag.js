// One-off repair: realign area-admin district spellings to master data.
// Dry run by default; pass --apply to write.
require("dotenv").config();
const mongoose = require("mongoose");
const MasterLocation = require("./models/masterLocation");
const Admin = require("./models/admin");

const APPLY = process.argv[2] === "--apply";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const districts = await MasterLocation.find({ type: "district" }).select("title").lean();
  const titleById = new Map(districts.map((d) => [String(d._id), d.title]));

  const map = new Map();
  for (const a of await MasterLocation.find({ type: "area" }).select("title parent").lean()) {
    const key = a.title.trim().toUpperCase();
    const d = titleById.get(String(a.parent));
    if (!d) continue;
    map.set(key, map.has(key) && map.get(key) !== d ? null : d);
  }

  const admins = await Admin.find({ role: "areaadmin" }).select("username district area");
  let changed = 0;
  for (const admin of admins) {
    const master = map.get((admin.area || "").toUpperCase());
    if (!master || master.toUpperCase() === (admin.district || "").toUpperCase()) continue;
    console.log(`${admin.username}: "${admin.district}" -> "${master}"`);
    changed++;
    if (APPLY) {
      // updateOne, not save() — save() would re-hash the already-hashed password.
      await Admin.updateOne({ _id: admin._id }, { $set: { district: master } });
    }
  }
  console.log(APPLY ? `Applied to ${changed} area admins` : `Dry run — ${changed} would change`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
