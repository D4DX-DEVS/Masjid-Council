const Setting = require("../models/setting");

// Which admin-console features the state admin ("admin" role) may use. The super admin owns
// this switch; it never applies to the super admin, who always has access.
//
// The list is the allowlist — a key that is not here cannot be toggled, so a crafted request
// cannot invent a flag or write arbitrary data into the settings document.

const SETTING_KEY = "admin-feature-access";

const FEATURES = {
  formBuilder: {
    label: "Form Builder",
    // Open by default: this is how both features behaved before the switch existed, and a
    // deploy should not silently take access away from someone who had it.
    default: true,
  },
  publications: {
    label: "Publications",
    default: true,
  },
};

const FEATURE_KEYS = Object.keys(FEATURES);

const defaults = () =>
  Object.fromEntries(FEATURE_KEYS.map((key) => [key, FEATURES[key].default]));

// Always returns every known feature, so a caller never has to handle a missing key. Stored
// values that are not booleans, and keys no longer in FEATURES, are ignored.
const getFeatureAccess = async () => {
  const setting = await Setting.findOne({ key: SETTING_KEY });
  const stored = setting && setting.value ? setting.value : {};
  const access = defaults();
  for (const key of FEATURE_KEYS) {
    if (typeof stored[key] === "boolean") access[key] = stored[key];
  }
  return access;
};

const setFeatureAccess = async (input) => {
  const current = await getFeatureAccess();
  const next = { ...current };
  for (const key of FEATURE_KEYS) {
    if (typeof input?.[key] === "boolean") next[key] = input[key];
  }
  await Setting.findOneAndUpdate(
    { key: SETTING_KEY },
    { $set: { value: next } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return next;
};

/**
 * Guard for the admin-only endpoints of a feature. Mount it *after* authenticateAdmin, which
 * is what establishes req.user.
 *
 * Hiding the sidebar entry is cosmetic — anyone can type the URL, and the page's data comes
 * from these endpoints. This is the check that actually enforces the switch.
 */
const requireFeature = (feature) => async (req, res, next) => {
  if (!FEATURES[feature]) {
    // A typo in a route file would otherwise silently allow everything.
    return next(new Error(`Unknown feature flag: ${feature}`));
  }
  if (req.user?.role === "superadmin") return next();

  try {
    const access = await getFeatureAccess();
    if (access[feature]) return next();
    return res.status(403).json({
      success: false,
      code: "FEATURE_DISABLED",
      message: `${FEATURES[feature].label} is not available for your account.`,
    });
  } catch (error) {
    console.error("Feature access check error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  FEATURES,
  FEATURE_KEYS,
  SETTING_KEY,
  getFeatureAccess,
  setFeatureAccess,
  requireFeature,
};
