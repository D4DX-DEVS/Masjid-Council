// Server-side validation of a dynamic-form submission against its FormConfiguration.
// Mirrors the client renderer's rules: required/enabled flags, conditional logic,
// option membership, and basic length/number/pattern validation.

const STRUCTURAL_TYPES = ["title", "group", "html", "page"];

// Duplicate keys are compared after normalization, so "MAF 1758-696285" and
// "maf1758696285" are the same masjid and "1234 5678 9012" is the same Aadhaar.
// Whatever this returns is what gets stored and queried — change it and old
// submissions stop matching new ones.
const normalizeKey = (value) => String(value).replace(/[\s-]/g, "").toUpperCase();

const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) {
    // row tables: empty when every cell is empty
    return value.every((v) => isEmpty(v));
  }
  return false;
};

// Evaluate whether a field is visible/required given conditionalLogic and current data.
// Returns { visible, required }.
const applyConditional = (field, formData) => {
  let visible = true;
  let required = !!field.required;
  const logic = field.conditionalLogic;
  if (!logic || logic.field === undefined || logic.field === null) {
    return { visible, required };
  }

  const watched = formData[`field_${logic.field}`];
  const watchedStr = watched === undefined || watched === null ? "" : String(watched);
  const target = logic.value === undefined || logic.value === null ? "" : String(logic.value);

  let matches;
  switch (logic.operator) {
    case "equals":
      matches = watchedStr === target;
      break;
    case "not_equals":
      matches = watchedStr !== target;
      break;
    case "contains":
      matches = watchedStr.toLowerCase().includes(target.toLowerCase());
      break;
    case "not_contains":
      matches = !watchedStr.toLowerCase().includes(target.toLowerCase());
      break;
    case "greater_than":
      matches = Number(watchedStr) > Number(target);
      break;
    case "less_than":
      matches = Number(watchedStr) < Number(target);
      break;
    case "is_empty":
      matches = isEmpty(watched);
      break;
    case "is_not_empty":
      matches = !isEmpty(watched);
      break;
    default:
      matches = true;
  }

  const action = logic.action || "show";
  if (action === "show") visible = matches;
  else if (action === "hide") visible = !matches;
  else if (action === "require") required = required || matches;
  else if (action === "optional") required = required && !matches;

  return { visible, required };
};

const validateField = (field, value, errors) => {
  const label = field.label;
  const v = field.validation || {};

  if (typeof value === "string") {
    if (v.minLength && value.trim().length < v.minLength) {
      errors.push(v.customMessage || `${label}: minimum ${v.minLength} characters`);
      return;
    }
    if (v.maxLength && value.trim().length > v.maxLength) {
      errors.push(v.customMessage || `${label}: maximum ${v.maxLength} characters`);
      return;
    }
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(value)) {
          errors.push(v.customMessage || `${label}: invalid format`);
          return;
        }
      } catch {
        // bad regex in config — don't block the applicant
      }
    }
  }

  if (field.type === "number" && !isEmpty(value)) {
    const num = Number(value);
    if (Number.isNaN(num)) {
      errors.push(`${label}: must be a number`);
      return;
    }
    if (v.min !== undefined && v.min !== null && num < v.min) {
      errors.push(v.customMessage || `${label}: minimum ${v.min}`);
      return;
    }
    if (v.max !== undefined && v.max !== null && num > v.max) {
      errors.push(v.customMessage || `${label}: maximum ${v.max}`);
      return;
    }
  }

  // Single-choice fields must hold one of the configured options
  if (
    ["select", "radio"].includes(field.type) &&
    !isEmpty(value) &&
    Array.isArray(field.options) &&
    field.options.length > 0 &&
    !field.options.includes(value)
  ) {
    errors.push(`${label}: invalid option`);
    return;
  }

  // Multi-choice values must be a subset of options
  if (
    ["checkbox", "multiselect"].includes(field.type) &&
    !isEmpty(value) &&
    Array.isArray(field.options) &&
    field.options.length > 0
  ) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some((item) => !field.options.includes(item))) {
      errors.push(`${label}: invalid option`);
    }
    return;
  }

  if (field.type === "yesno" && !isEmpty(value) && !["yes", "no"].includes(String(value))) {
    errors.push(`${label}: must be yes or no`);
  }
};

/**
 * @param {object} config FormConfiguration (plain object or mongoose doc)
 * @param {object} formData { "field_<id>": value }
 * @returns {{ errors: string[], uniqueKeys: {fieldId: number, value: string, blocks: string, lockYears: number|null}[],
 *             district: string, area: string, applicantName: string, phone: string }}
 */
const validateSubmission = (config, formData) => {
  const errors = [];
  const data = formData || {};
  const uniqueKeys = [];

  for (const page of config.pages || []) {
    for (const field of page.fields || []) {
      if (!field.enabled || STRUCTURAL_TYPES.includes(field.type)) continue;

      const { visible, required } = applyConditional(field, data);
      if (!visible) continue;

      const value = data[`field_${field.id}`];
      // A unique field is the form's duplicate key, so it is always mandatory —
      // a key nobody filled in cannot identify anything. That holds even if the
      // builder's own required flag was left off.
      if ((required || field.unique) && isEmpty(value)) {
        errors.push(`${field.label} is required`);
        continue;
      }
      if (isEmpty(value)) continue;

      const errorsBefore = errors.length;
      validateField(field, value, errors);

      // Only collect a key the field's own rules accepted. Format comes from the
      // field's validation.pattern, never from a hardcoded shape — an MAF
      // affiliation number and a 12-digit Aadhaar are both legitimate keys.
      if (field.unique && errors.length === errorsBefore) {
        uniqueKeys.push({
          fieldId: field.id,
          value: normalizeKey(value),
          blocks: field.uniqueBlocks === "active" ? "active" : "approved",
          lockYears: Number.isFinite(Number(field.uniqueLockYears)) && field.uniqueLockYears !== null
            ? Number(field.uniqueLockYears)
            : null,
        });
      }
    }
  }

  const mapping = config.roleMapping || {};
  const pick = (fieldId) => {
    if (fieldId === undefined || fieldId === null) return "";
    const value = data[`field_${fieldId}`];
    return value === undefined || value === null ? "" : String(value).trim();
  };

  const toAmount = (raw) => (raw !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : null);

  // Aadhaar: mapped form types must always carry a valid 12-digit number, even if
  // the field's own required flag was left off in the builder.
  let aadhaarNumber = "";
  if (mapping.aadhaarFieldId !== undefined && mapping.aadhaarFieldId !== null) {
    aadhaarNumber = pick(mapping.aadhaarFieldId).replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      errors.push("Aadhaar number must be exactly 12 digits");
      aadhaarNumber = "";
    }
  }

  return {
    errors,
    uniqueKeys,
    district: pick(mapping.districtFieldId),
    area: pick(mapping.areaFieldId),
    applicantName: pick(mapping.nameFieldId),
    phone: pick(mapping.phoneFieldId),
    requestedAmount: toAmount(pick(mapping.amountFieldId)),
    ownContribution: toAmount(pick(mapping.ownAmountFieldId)),
    aadhaarNumber,
  };
};

module.exports = validateSubmission;
module.exports.normalizeKey = normalizeKey;
