// Seeds the 4 dynamic form configurations. Skips a form if a config already exists,
// so it never overwrites admin edits. Run: node seedFormConfigs.js
require("dotenv").config();
const mongoose = require("mongoose");
const FormConfiguration = require("./models/formConfiguration");

// District/Area selects are left with empty options — the renderer fills them
// from master-data when the field id matches roleMapping.districtFieldId/areaFieldId.

const welfarefundConfig = {
  formType: "welfarefund",
  title: "ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി — സഹായം ലഭിക്കാനുള്ള അപേക്ഷ",
  description: "Masjid Council Kerala — Imam Muadhin Welfare Fund application",
  enabled: true,
  isPublished: true,
  publishedAt: new Date(),
  instructions: [
    { id: 1, text: "MCK യിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദിലെ ജീവനക്കാർക്ക് വേണ്ടിയാണ് അപേക്ഷ നൽകേണ്ടത്.", order: 1 },
    { id: 2, text: "മസ്ജിദ് പ്രസിഡന്റ് / സെക്രട്ടറിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്.", order: 2 },
    { id: 3, text: "ജീവനക്കാരനെ സംബന്ധിച്ച വിശദവിവരങ്ങൾ രേഖപ്പെടുത്തേണ്ട ഫോറവും നിർബന്ധമായും പൂരിപ്പിച്ച് നൽകേണ്ടതാണ്.", order: 3 },
    { id: 4, text: "സർവീസിൽ തുടരുന്ന സന്ദർഭത്തിൽ മാത്രമേ സഹായം ലഭ്യമാവുകയുള്ളൂ.", order: 4 },
    { id: 5, text: "MCK യിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദുകളിൽ തുടർച്ചയായി 5 വർഷം സർവീസ് ഉണ്ടായിരിക്കണം.", order: 5 },
    { id: 6, text: "ജീവനക്കാരന്റെ ആധാർ കോപ്പി, ബാങ്ക് പാസ് ബുക്കിന്റെ കോപ്പി എന്നിവ അപേക്ഷയോടൊപ്പം ചേർക്കണം.", order: 6 },
  ],
  roleMapping: { districtFieldId: 11, areaFieldId: 12, phoneFieldId: 5, nameFieldId: 13 },
  pages: [
    {
      id: 1,
      title: "മസ്ജിദിന്റെ വിവരങ്ങൾ",
      order: 1,
      fields: [
        { id: 1, label: "മസ്ജിദിന്റെ പേര്", type: "text", required: true, enabled: true },
        { id: 2, label: "എം സി കെ അഫിലിയേഷൻ നമ്പർ", type: "text", required: true, enabled: true },
        { id: 3, label: "വിലാസം", type: "textarea", required: true, enabled: true },
        { id: 4, label: "പരിപാലന കമ്മിറ്റി പ്രസിഡന്റ് / സെക്രട്ടറി", type: "text", required: true, enabled: true },
        { id: 5, label: "ഫോൺ", type: "phone", required: true, enabled: true },
        { id: 6, label: "വാട്സാപ്പ് നമ്പർ", type: "phone", required: false, enabled: true },
        { id: 7, label: "മാനേജിംഗ് കമ്മിറ്റി / ട്രസ്റ്റ്", type: "text", required: false, enabled: true },
        { id: 8, label: "പ്രസിഡന്റ് / ചെയർമാൻ", type: "text", required: false, enabled: true },
        { id: 9, label: "പ്രസിഡന്റ് / ചെയർമാൻ ഫോൺ", type: "phone", required: false, enabled: true },
        { id: 10, label: "ജമാഅത്തെ ഇസ്ലാമി പ്രാദേശിക ഘടകം", type: "text", required: false, enabled: true },
        { id: 11, label: "ജില്ല", type: "select", required: true, enabled: true, options: [] },
        { id: 12, label: "ഏരിയ", type: "select", required: true, enabled: true, options: [] },
      ],
    },
    {
      id: 2,
      title: "സഹായം ആവശ്യമായ വിവരങ്ങൾ",
      order: 2,
      fields: [
        { id: 13, label: "അപേക്ഷ സമർപ്പിക്കുന്നത് ആർക്ക് വേണ്ടി", type: "text", required: true, enabled: true },
        { id: 14, label: "ജോലി ചെയ്യുന്ന തസ്തിക", type: "select", required: true, enabled: true, options: ["ഇമാം", "മുഅദ്ദിൻ", "ഇമാം & മുഅദ്ദിൻ", "മറ്റുള്ളവ"] },
        { id: 15, label: "വേതനം", type: "number", required: false, enabled: true },
        { id: 16, label: "സഹായം ആവശ്യമായ ഇനം", type: "select", required: true, enabled: true, options: ["വീട് റിപ്പയർ", "വിവാഹം", "ചികിത്സ", "വിദ്യാഭ്യാസം"] },
        { id: 17, label: "ആവശ്യത്തിന്റെ വിശദവിവരം", type: "textarea", required: true, enabled: true },
        { id: 18, label: "പ്രതീക്ഷിക്കുന്ന ചെലവ്", type: "number", required: true, enabled: true },
        { id: 19, label: "സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക", type: "number", required: false, enabled: true },
        { id: 20, label: "മസ്ജിദ് കൗൺസിലിൽ നിന്ന് മുമ്പ് സഹായം ലഭ്യമായിട്ടുണ്ടോ", type: "yesno", required: true, enabled: true },
        { id: 21, label: "ഉണ്ടെങ്കിൽ ഏത് ആവശ്യത്തിന്", type: "text", required: true, enabled: true, conditionalLogic: { field: 20, operator: "equals", value: "yes", action: "show" } },
        { id: 22, label: "ലഭിച്ച സംഖ്യ", type: "number", required: false, enabled: true, conditionalLogic: { field: 20, operator: "equals", value: "yes", action: "show" } },
        { id: 23, label: "വർഷം", type: "text", required: false, enabled: true, conditionalLogic: { field: 20, operator: "equals", value: "yes", action: "show" } },
        { id: 24, label: "മസ്ജിദ് പ്രസിഡന്റ് / സെക്രട്ടറി", type: "text", required: true, enabled: true },
        { id: 25, label: "പ്രസിഡന്റ് / സെക്രട്ടറി ഫോൺ", type: "phone", required: true, enabled: true },
      ],
    },
    {
      id: 3,
      title: "സഹായം ആവശ്യമായ ജീവനക്കാരന്റെ വിശദവിവരം",
      order: 3,
      fields: [
        { id: 26, label: "പേര്", type: "text", required: true, enabled: true },
        { id: 27, label: "ജോലി ചെയ്യുന്ന മസ്ജിദ്", type: "text", required: true, enabled: true },
        { id: 28, label: "തസ്തിക", type: "text", required: false, enabled: true },
        { id: 29, label: "വേതനം", type: "number", required: false, enabled: true },
        { id: 30, label: "നിലവിലെ മസ്ജിദിൽ ജോലി ആരംഭിച്ച വർഷം", type: "text", required: false, enabled: true },
        { id: 31, label: "മാസം", type: "text", required: false, enabled: true },
        {
          id: 32,
          label: "മുമ്പ് ജോലി ചെയ്ത മസ്ജിദുകളുടെ വിശദാംശങ്ങൾ",
          type: "row",
          required: false,
          enabled: true,
          columns: 4,
          columnTitles: ["പള്ളിയുടെ പേര്", "MCK അഫിലിയേഷൻ നമ്പർ", "തസ്തിക", "ജോലി ചെയ്ത കാലം"],
          rows: 4,
          firstColumnHeader: "ക്രമ നമ്പർ",
          allowAddRows: true,
        },
        { id: 33, label: "മസ്ജിദിലെ ജോലിക്ക് പുറമെയുള്ള മറ്റു വരുമാന മാർഗ്ഗങ്ങൾ", type: "text", required: false, enabled: true },
        { id: 34, label: "വരുമാനം", type: "number", required: false, enabled: true },
        { id: 35, label: "വയസ്സ്", type: "number", required: false, enabled: true },
        { id: 36, label: "വിവാഹിതനാണോ", type: "yesno", required: false, enabled: true },
        { id: 37, label: "ഭാര്യ (പേര്, വയസ്സ്, ജോലി, വരുമാനം)", type: "text", required: false, enabled: true, conditionalLogic: { field: 36, operator: "equals", value: "yes", action: "show" } },
        {
          id: 38,
          label: "മറ്റു കുടുംബാംഗങ്ങൾ",
          type: "row",
          required: false,
          enabled: true,
          columns: 5,
          columnTitles: ["പേര്", "ബന്ധം", "വയസ്സ്", "ജോലി", "വരുമാനം"],
          rows: 5,
          firstColumnHeader: "ക്രമ നമ്പർ",
          allowAddRows: true,
        },
        { id: 39, label: "ജീവനക്കാരന്റെ സ്ഥിരം വിലാസം", type: "textarea", required: true, enabled: true },
      ],
    },
    {
      id: 4,
      title: "രേഖകൾ",
      order: 4,
      fields: [
        { id: 40, label: "ആധാർ കോപ്പി", type: "file", required: true, enabled: true, helpText: "PDF/JPG, പരമാവധി 5 MB" },
        { id: 41, label: "ബാങ്ക് പാസ് ബുക്കിന്റെ കോപ്പി", type: "file", required: true, enabled: true, helpText: "അക്കൗണ്ട് നമ്പർ, അക്കൗണ്ട് ഹോൾഡറുടെ പേര് ഉള്ള ഭാഗം" },
        { id: 42, label: "അനുബന്ധ രേഖകൾ (എസ്റ്റിമേറ്റ് / ഡോക്ടറുടെ ശുപാർശ / ഫീസ് ഘടന)", type: "file", required: false, enabled: true },
      ],
    },
  ],
};

const mosquefundConfig = {
  formType: "mosquefund",
  title: "മസ്ജിദ് ഫണ്ട് — സഹായം ലഭിക്കാനുള്ള അപേക്ഷ",
  description: "Masjid Council Kerala — Masjid Fund application",
  enabled: true,
  isPublished: true,
  publishedAt: new Date(),
  instructions: [
    { id: 1, text: "MCK യിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദുകൾക്ക് വേണ്ടിയുള്ള സംവിധാനമാണിത്. അഫിലിയേറ്റ് ചെയ്യാത്ത പള്ളികളുടെ അപേക്ഷ പരിഗണിക്കുകയില്ല.", order: 1 },
    { id: 2, text: "എല്ലാ മാസവും ആദ്യത്തെ വെള്ളിയാഴ്ച ജുമുഅക്ക് ശേഷം മസ്ജിദ് ഫണ്ട് സമാഹരിക്കുകയും കേന്ദ്രത്തിലടക്കുകയും ചെയ്യുന്ന പള്ളികൾക്കാണ് സഹായത്തിന് അർഹതയുള്ളത്.", order: 2 },
    { id: 3, text: "പള്ളികളുമായി ബന്ധപ്പെട്ട അറ്റകുറ്റപ്പണികൾക്ക് വേണ്ടിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്.", order: 3 },
    { id: 4, text: "മസ്ജിദ് പ്രസിഡന്റ് / സെക്രട്ടറിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്.", order: 4 },
    { id: 5, text: "സഹായം ആവശ്യമായ ഇനത്തിന്റെ പ്ലാൻ, എസ്റ്റിമേറ്റ് എന്നിവ അപേക്ഷയോടൊപ്പം സമർപ്പിക്കേണ്ടതാണ്.", order: 5 },
    { id: 6, text: "ഒരു തവണ സഹായം അനുവദിക്കപ്പെട്ട മസ്ജിദുകൾക്ക് നാല് വർഷത്തിന് ശേഷം മാത്രമേ വീണ്ടും അപേക്ഷിക്കാൻ അർഹതയുള്ളൂ.", order: 6 },
    { id: 7, text: "മസ്ജിദിന്റെ ബാങ്ക് പാസ് ബുക്കിന്റെ കോപ്പി അപേക്ഷയോടൊപ്പം ചേർക്കണം. ചെക്ക് വഴി മാത്രമേ സഹായം ലഭിക്കൂ.", order: 7 },
    { id: 8, text: "അക്കൗണ്ട് മസ്ജിദ് / മാനേജിംഗ് കമ്മിറ്റി / ട്രസ്റ്റിന്റെ പേരിലുള്ളതായിരിക്കണം.", order: 8 },
    { id: 9, text: "സഹായം സ്വീകരിച്ചതിന്റെ റസീപ്റ്റ് മസ്ജിദ് കൗൺസിൽ കേരളക്ക് നൽകേണ്ടതാണ്.", order: 9 },
  ],
  roleMapping: { districtFieldId: 9, areaFieldId: 10, phoneFieldId: 17, nameFieldId: 1 },
  pages: [
    {
      id: 1,
      title: "മസ്ജിദിന്റെ വിവരങ്ങൾ",
      order: 1,
      fields: [
        { id: 1, label: "മസ്ജിദിന്റെ പേര്", type: "text", required: true, enabled: true },
        { id: 2, label: "എം സി കെ അഫിലിയേഷൻ നമ്പർ", type: "text", required: true, enabled: true },
        { id: 3, label: "വിലാസം", type: "textarea", required: true, enabled: true },
        { id: 4, label: "മാനേജിംഗ് കമ്മിറ്റി / ട്രസ്റ്റ്", type: "text", required: false, enabled: true },
        { id: 5, label: "പ്രസിഡന്റ് / ചെയർമാൻ", type: "text", required: false, enabled: true },
        { id: 6, label: "പ്രസിഡന്റ് / ചെയർമാൻ ഫോൺ", type: "phone", required: false, enabled: true },
        { id: 7, label: "ജമാഅത്തെ ഇസ്ലാമി പ്രാദേശിക ഘടകം", type: "text", required: false, enabled: true },
        { id: 9, label: "ജില്ല", type: "select", required: true, enabled: true, options: [] },
        { id: 10, label: "ഏരിയ", type: "select", required: true, enabled: true, options: [] },
      ],
    },
    {
      id: 2,
      title: "ഫണ്ട് / സഹായ വിവരങ്ങൾ",
      order: 2,
      fields: [
        { id: 11, label: "മസ്ജിദ് കൗൺസിൽ കേരളക്ക് മാസാന്ത ഫണ്ട് ശേഖരണം നടക്കാറുണ്ടോ", type: "yesno", required: true, enabled: true },
        { id: 12, label: "മസ്ജിദ് കൗൺസിലിൽ നിന്ന് മുമ്പ് സഹായം ലഭ്യമായിട്ടുണ്ടോ", type: "yesno", required: true, enabled: true },
        { id: 13, label: "ഉണ്ടെങ്കിൽ ഏത് ആവശ്യത്തിന്", type: "textarea", required: true, enabled: true, conditionalLogic: { field: 12, operator: "equals", value: "yes", action: "show" } },
        { id: 14, label: "ലഭിച്ച സംഖ്യ", type: "number", required: false, enabled: true, conditionalLogic: { field: 12, operator: "equals", value: "yes", action: "show" } },
        { id: 15, label: "വർഷം", type: "text", required: false, enabled: true, conditionalLogic: { field: 12, operator: "equals", value: "yes", action: "show" } },
        { id: 16, label: "മസ്ജിദ് പ്രസിഡന്റ് / സെക്രട്ടറി", type: "text", required: true, enabled: true },
        { id: 17, label: "ഫോൺ", type: "phone", required: true, enabled: true },
        { id: 18, label: "വാട്സാപ്പ് നമ്പർ", type: "phone", required: false, enabled: true },
      ],
    },
    {
      id: 3,
      title: "ഇപ്പോൾ ആവശ്യമായ സഹായം",
      order: 3,
      fields: [
        { id: 19, label: "ഇപ്പോൾ സഹായം ആവശ്യമായ ഇനം", type: "text", required: true, enabled: true },
        { id: 20, label: "ആവശ്യത്തിന്റെ വിശദവിവരം", type: "textarea", required: true, enabled: true },
        { id: 21, label: "പ്രതീക്ഷിക്കുന്ന ചെലവ്", type: "number", required: true, enabled: true },
        { id: 22, label: "സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക", type: "number", required: false, enabled: true },
        { id: 23, label: "ബാങ്ക് പാസ് ബുക്കിന്റെ കോപ്പി", type: "file", required: true, enabled: true, helpText: "അക്കൗണ്ട് നമ്പർ, അക്കൗണ്ട് ഹോൾഡറുടെ പേര് ഉള്ള ഭാഗം" },
        { id: 24, label: "പ്ലാൻ / എസ്റ്റിമേറ്റ്", type: "file", required: true, enabled: true },
      ],
    },
  ],
};

const affiliationConfig = {
  formType: "affiliation",
  title: "മസ്ജിദ് അഫിലിയേഷൻ അപേക്ഷ",
  description: "Masjid Council Kerala — Mosque affiliation application",
  enabled: true,
  isPublished: true,
  publishedAt: new Date(),
  instructions: [],
  roleMapping: { districtFieldId: 6, areaFieldId: 11, phoneFieldId: 8, nameFieldId: 1 },
  pages: [
    {
      id: 1,
      title: "മസ്ജിദിന്റെ വിവരങ്ങൾ",
      order: 1,
      fields: [
        { id: 1, label: "മസ്ജിദിന്റെ പേര്", type: "text", required: true, enabled: true },
        { id: 2, label: "മസ്ജിദ് തരം", type: "select", required: true, enabled: true, options: ["ജുമുഅത്ത് പള്ളി", "നമസ്ക്‌കാരപള്ളി"] },
        { id: 3, label: "മഹല്ല് തരം", type: "text", required: true, enabled: true },
        { id: 4, label: "സ്ഥാപിത വർഷം", type: "number", required: true, enabled: true },
        { id: 5, label: "വിലാസം", type: "textarea", required: true, enabled: true },
        { id: 6, label: "ജില്ല", type: "select", required: true, enabled: true, options: [] },
        { id: 7, label: "പിൻകോഡ്", type: "number", required: true, enabled: true },
        { id: 8, label: "ഫോൺ", type: "phone", required: true, enabled: true },
        { id: 9, label: "ഇമെയിൽ", type: "email", required: false, enabled: true },
        { id: 10, label: "ജമാഅത്ത് ഏരിയ", type: "title", required: false, enabled: true },
        { id: 11, label: "ഏരിയ", type: "select", required: true, enabled: true, options: [] },
      ],
    },
    {
      id: 2,
      title: "സൗകര്യങ്ങളും ശേഷിയും",
      order: 2,
      fields: [
        { id: 12, label: "സൗകര്യങ്ങൾ", type: "checkbox", required: false, enabled: true, options: ["വുദു ഖാന", "ടോയ്‌ലറ്റ്", "മദ്രസ", "ലൈബ്രറി", "പാർക്കിംഗ്"] },
        { id: 13, label: "ഖബർസ്ഥാൻ ഉണ്ടോ", type: "yesno", required: false, enabled: true },
        { id: 14, label: "ഖബർസ്ഥാൻ വിവരം", type: "text", required: false, enabled: true, conditionalLogic: { field: 13, operator: "equals", value: "yes", action: "show" } },
        { id: 15, label: "മസ്ജിദ് ശേഷി (പേർ)", type: "number", required: true, enabled: true },
        { id: 16, label: "മസ്ജിദ് വിസ്തീർണ്ണം", type: "text", required: true, enabled: true },
        { id: 17, label: "വെള്ളിയാഴ്ച പുരുഷ ഹാജർ", type: "number", required: true, enabled: true },
        { id: 18, label: "വെള്ളിയാഴ്ച സ്ത്രീ ഹാജർ", type: "number", required: true, enabled: true },
      ],
    },
    {
      id: 3,
      title: "സാമ്പത്തികം & കമ്മിറ്റി",
      order: 3,
      fields: [
        { id: 19, label: "ആസ്തികൾ", type: "textarea", required: false, enabled: true },
        { id: 20, label: "വരുമാന സ്രോതസ്സ്", type: "text", required: false, enabled: true },
        { id: 21, label: "പ്രതിമാസ ചെലവ്", type: "number", required: false, enabled: true },
        { id: 22, label: "കഴിഞ്ഞ വർഷത്തെ വരുമാനം", type: "number", required: false, enabled: true },
        { id: 23, label: "കഴിഞ്ഞ വർഷത്തെ ചെലവ്", type: "number", required: false, enabled: true },
        { id: 24, label: "ഓഡിറ്റ് ഉണ്ടോ", type: "yesno", required: false, enabled: true },
        {
          id: 25,
          label: "കമ്മിറ്റി ഭാരവാഹികൾ",
          type: "row",
          required: false,
          enabled: true,
          columns: 3,
          columnTitles: ["പേര്", "സ്ഥാനം", "ഫോൺ"],
          rows: 3,
          firstColumnHeader: "ക്രമ നമ്പർ",
          allowAddRows: true,
        },
        {
          id: 26,
          label: "ജീവനക്കാർ",
          type: "row",
          required: false,
          enabled: true,
          columns: 4,
          columnTitles: ["തസ്തിക", "വയസ്സ്", "വേതനം", "യോഗ്യത"],
          rows: 3,
          firstColumnHeader: "ക്രമ നമ്പർ",
          allowAddRows: true,
        },
      ],
    },
  ],
};

const khateebConfig = {
  formType: "khateeb",
  title: "ഖത്തീബ് രജിസ്ട്രേഷൻ",
  description: "Masjid Council Kerala — Khateeb registration",
  enabled: true,
  isPublished: true,
  publishedAt: new Date(),
  instructions: [],
  roleMapping: { districtFieldId: 6, areaFieldId: 7, phoneFieldId: 2, nameFieldId: 1 },
  pages: [
    {
      id: 1,
      title: "വ്യക്തിഗത വിവരങ്ങൾ",
      order: 1,
      fields: [
        { id: 1, label: "പേര്", type: "text", required: true, enabled: true },
        { id: 2, label: "ഫോൺ", type: "phone", required: true, enabled: true },
        { id: 3, label: "ഇമെയിൽ", type: "email", required: false, enabled: true },
        { id: 4, label: "മസ്ജിദിന്റെ പേര്", type: "text", required: true, enabled: true },
        { id: 5, label: "മഹല്ല്", type: "text", required: true, enabled: true },
        { id: 6, label: "ജില്ല", type: "select", required: true, enabled: true, options: [] },
        { id: 7, label: "ഏരിയ", type: "select", required: false, enabled: true, options: [] },
        { id: 8, label: "ഖുതുബ പതിവാണോ", type: "radio", required: true, enabled: true, options: ["regular", "occasional"] },
        { id: 9, label: "പ്രസ്ഥാന ബന്ധം", type: "select", required: true, enabled: true, options: ["rukn", "karkun", "active_associate", "none"] },
        { id: 10, label: "പങ്കെടുക്കുന്നുണ്ടോ", type: "yesno", required: true, enabled: true },
        { id: 11, label: "പങ്കെടുക്കാത്തതിന്റെ കാരണം", type: "textarea", required: false, enabled: true, conditionalLogic: { field: 10, operator: "equals", value: "no", action: "show" } },
      ],
    },
  ],
};

const CONFIGS = [welfarefundConfig, mosquefundConfig, affiliationConfig, khateebConfig];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const config of CONFIGS) {
    const existing = await FormConfiguration.findOne({ formType: config.formType });
    if (existing) {
      console.log(`skip ${config.formType} — config already exists (v${existing.version})`);
      continue;
    }
    await FormConfiguration.create(config);
    console.log(`seeded ${config.formType}`);
  }

  await mongoose.disconnect();
  console.log("Done");
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
