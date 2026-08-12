// One-off migration: add a required Aadhaar field to the welfarefund and
// mosquefund dynamic forms and map roleMapping.aadhaarFieldId to it.
// Run: node addAadhaarField.js   (needs MONGODB_URI in .env)
// Idempotent — skips a form whose aadhaarFieldId is already mapped.

require("dotenv").config();
const mongoose = require("mongoose");
const FormConfiguration = require("./models/formConfiguration");

const FORM_TYPES = ["welfarefund", "mosquefund"];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const formType of FORM_TYPES) {
    const config = await FormConfiguration.findOne({ formType });
    if (!config) {
      console.log(`${formType}: no config found, skipped`);
      continue;
    }
    if (config.roleMapping && config.roleMapping.aadhaarFieldId !== null && config.roleMapping.aadhaarFieldId !== undefined) {
      console.log(`${formType}: aadhaarFieldId already mapped (${config.roleMapping.aadhaarFieldId}), skipped`);
      continue;
    }
    if (!config.pages.length) {
      console.log(`${formType}: no pages, skipped`);
      continue;
    }

    const maxId = Math.max(0, ...config.pages.flatMap((p) => p.fields.map((f) => f.id)));
    const field = {
      id: maxId + 1,
      label: "ആധാർ നമ്പർ (Aadhaar Number)",
      type: "text",
      required: true,
      enabled: true,
      placeholder: "12 അക്ക ആധാർ നമ്പർ",
      helpText: "അപേക്ഷകന്റെ 12 അക്ക ആധാർ നമ്പർ നൽകുക",
      validation: {
        pattern: "^\\d{12}$",
        customMessage: "ആധാർ നമ്പർ 12 അക്കങ്ങൾ ആയിരിക്കണം",
      },
    };

    config.pages[0].fields.push(field);
    config.roleMapping.aadhaarFieldId = field.id;
    config.version += 1;
    await config.save();
    console.log(`${formType}: added Aadhaar field id ${field.id}, version now ${config.version}`);
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
