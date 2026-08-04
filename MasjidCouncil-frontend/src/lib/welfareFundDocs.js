// Imam/Muaddin Welfare Fund help purposes (MedicalAidForm `helpPurpose` values) and the
// documents each purpose needs. Single source of truth for the application form, the admin
// detail view and the super-admin detail view, so they cannot drift apart.
// `key` is what gets stored in the welfarefund `documents` map on the backend - never rename
// a key without migrating existing records.

const COMMON_DOCS = [
  { key: 'aadhaarCopy', required: true, ml: 'ജീവനക്കാരന്റെ ആധാർ കോപ്പി', en: 'Employee Aadhaar Copy' },
  { key: 'bankPassbook', required: true, ml: 'മസ്ജിദ് ബാങ്ക് പാസ് ബുക്ക് കോപ്പി', en: 'Mosque Bank Passbook Copy' },
];

const PURPOSES = {
  house: {
    ml: 'വീട് റിപ്പയർ',
    en: 'House Repair',
    docs: [
      { key: 'repairEstimate', required: false, ml: 'വീട് റിപ്പയർ എസ്റ്റിമേറ്റ്', en: 'House Repair Estimate' },
      { key: 'housePhotos', required: false, ml: 'വീടിന്റെ ഫോട്ടോകൾ', en: 'House Photos' },
    ],
  },
  marriage: {
    ml: 'വിവാഹം',
    en: 'Marriage',
    docs: [
      { key: 'marriageProof', required: false, ml: 'വിവാഹം സംബന്ധിച്ച രേഖ', en: 'Marriage Proof Document' },
    ],
  },
  medical: {
    ml: 'ചികിത്സ',
    en: 'Medical Treatment',
    docs: [
      { key: 'doctorRecommendation', required: false, ml: 'ഡോക്ടറുടെ ശിപാർശ', en: "Doctor's Recommendation" },
    ],
  },
  education: {
    ml: 'വിദ്യാഭ്യാസം',
    en: 'Education',
    docs: [
      { key: 'courseFeeStructure', required: false, ml: 'കോഴ്സിന്റെ ഫീസ് ഘടന', en: 'Course Fee Structure' },
      { key: 'admissionDetails', required: false, ml: 'അഡ്‌മിഷൻ വിശദാംശങ്ങൾ', en: 'Admission Details' },
    ],
  },
};

// Unknown/empty purpose falls back to the raw value so old records stay readable.
export const getPurposeLabel = (purpose, lang = 'ml') =>
  PURPOSES[purpose]?.[lang] || purpose || '';

// Returns the document definitions for a purpose: common docs first, then purpose-specific.
export const getRequiredDocuments = (purpose) => [
  ...COMMON_DOCS,
  ...(PURPOSES[purpose]?.docs || []),
];

export const getDocLabel = (doc, lang = 'ml') => doc[lang];

// Document urls come from the database, which a public form writes to. Never put a
// stored string in an href without checking the scheme first - `javascript:...` in an
// href runs on click.
export const isViewableUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url);

// Keys of the docs that must be attached before the application can be submitted.
export const getMissingRequiredDocs = (purpose, documents = {}) =>
  getRequiredDocuments(purpose).filter((doc) => doc.required && !documents[doc.key]);
