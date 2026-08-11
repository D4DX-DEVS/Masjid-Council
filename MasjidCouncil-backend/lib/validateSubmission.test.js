const test = require("node:test");
const assert = require("node:assert");
const validateSubmission = require("./validateSubmission");

const config = {
  roleMapping: { districtFieldId: 3, areaFieldId: 4, phoneFieldId: null, nameFieldId: 1 },
  pages: [
    {
      id: 1,
      title: "Page 1",
      fields: [
        { id: 1, label: "Name", type: "text", required: true, enabled: true },
        { id: 2, label: "Details", type: "textarea", required: false, enabled: true },
        { id: 3, label: "District", type: "select", required: true, enabled: true, options: ["Kozhikode"] },
        { id: 4, label: "Area", type: "select", required: true, enabled: true, options: ["Area A"] },
        { id: 5, label: "Disabled field", type: "text", required: true, enabled: false },
        { id: 6, label: "Has previous help", type: "yesno", required: true, enabled: true },
        {
          id: 7,
          label: "Which purpose",
          type: "text",
          required: true,
          enabled: true,
          conditionalLogic: { field: 6, operator: "equals", value: "yes", action: "show" },
        },
        { id: 8, label: "Age", type: "number", required: false, enabled: true, validation: { min: 18, max: 99 } },
      ],
    },
  ],
};

test("missing required fields are reported by label", () => {
  const { errors } = validateSubmission(config, { field_3: "Kozhikode", field_4: "Area A", field_6: "no" });
  assert.ok(errors.some((e) => e.includes("Name")));
});

test("disabled required fields are not enforced", () => {
  const { errors } = validateSubmission(config, {
    field_1: "Someone",
    field_3: "Kozhikode",
    field_4: "Area A",
    field_6: "no",
  });
  assert.ok(!errors.some((e) => e.includes("Disabled field")));
});

test("conditionally hidden required field is not enforced", () => {
  const { errors } = validateSubmission(config, {
    field_1: "Someone",
    field_3: "Kozhikode",
    field_4: "Area A",
    field_6: "no", // field 7 only shows when yes
  });
  assert.strictEqual(errors.length, 0);
});

test("conditionally shown required field is enforced", () => {
  const { errors } = validateSubmission(config, {
    field_1: "Someone",
    field_3: "Kozhikode",
    field_4: "Area A",
    field_6: "yes",
  });
  assert.ok(errors.some((e) => e.includes("Which purpose")));
});

test("district/area/name are resolved via roleMapping", () => {
  const result = validateSubmission(config, {
    field_1: "Someone",
    field_3: "Kozhikode",
    field_4: "Area A",
    field_6: "no",
  });
  assert.strictEqual(result.district, "Kozhikode");
  assert.strictEqual(result.area, "Area A");
  assert.strictEqual(result.applicantName, "Someone");
});

test("number validation min/max", () => {
  const { errors } = validateSubmission(config, {
    field_1: "Someone",
    field_3: "Kozhikode",
    field_4: "Area A",
    field_6: "no",
    field_8: "10",
  });
  assert.ok(errors.some((e) => e.includes("Age")));
});

test("option value must be one of the configured options", () => {
  const { errors } = validateSubmission(config, {
    field_1: "Someone",
    field_3: "NotADistrict",
    field_4: "Area A",
    field_6: "no",
  });
  assert.ok(errors.some((e) => e.includes("District")));
});
