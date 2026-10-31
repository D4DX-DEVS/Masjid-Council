// Shape and validation of the home page customisation the admin edits in the browser.
//
// The frontend owns the defaults (src/lib/homepage/defaults.js) because it needs them to paint
// before this API answers. This file owns the allowlist: every key the admin can set, what kind
// of value it takes and how long it may be. Anything not described here is dropped, so a
// crafted request cannot store arbitrary data or smuggle in a value the page would trust.
//
// A dropped or missing value is not an error: the frontend falls back to its default for it,
// which is also how a field added in a later release reaches pages saved before it existed.

const text = (max) => ({ kind: "text", max });
const color = () => ({ kind: "color" });
const oneOf = (values) => ({ kind: "enum", values });
const bool = () => ({ kind: "bool" });
const image = () => ({ kind: "image" });
const link = () => ({ kind: "link" });
const mapEmbed = () => ({ kind: "mapEmbed" });
const video = () => ({ kind: "video" });
const list = (item, max) => ({ kind: "list", item, max });

const LATIN_FONTS = [
  "Poppins",
  "Plus Jakarta Sans",
  "Inter",
  "Montserrat",
  "Lato",
  "Open Sans",
  "Roboto",
  "Nunito",
  "Merriweather",
  "Playfair Display",
  "Cinzel",
];
const MALAYALAM_FONTS = [
  "Anek Malayalam",
  "Noto Sans Malayalam",
  "Noto Serif Malayalam",
  "Manjari",
  "Gayathri",
  "Baloo Chettan 2",
  "Chilanka",
];
const ARABIC_FONTS = ["Amiri", "Noto Naskh Arabic", "Scheherazade New", "Lateef", "Reem Kufi", "Cairo"];

const STAT_ICONS = [
  "Landmark",
  "Building2",
  "Layers",
  "BadgeCheck",
  "PieChart",
  "Users",
  "Home",
  "BookOpen",
  "HeartHandshake",
  "MapPin",
  "Star",
  "Award",
  "GraduationCap",
  "CalendarDays",
];

const THEME_SPEC = {
  primary: color(),
  primaryHover: color(),
  heading: color(),
  text: color(),
  muted: color(),
  accent: color(),
  pageBg: color(),
  fontHeading: oneOf(MALAYALAM_FONTS),
  fontBody: oneOf(MALAYALAM_FONTS),
  fontLatin: oneOf(LATIN_FONTS),
  fontHero: oneOf(LATIN_FONTS),
  fontArabic: oneOf(ARABIC_FONTS),
};

const PADDING = oneOf(["none", "xs", "sm", "md", "lg"]);
const WIDTH = oneOf(["narrow", "normal", "wide", "full"]);
const ALIGN = oneOf(["left", "center", "right"]);

const SECTION_SPECS = {
  hero: {
    layout: { align: ALIGN, bg: color(), headingColor: color(), textColor: color() },
    content: {
      ayah: text(300),
      translation: text(400),
      reference: text(120),
      titleMl: text(200),
      titleEn: text(200),
      bgImage: image(),
    },
  },
  // Publications and banners keep their content on their own admin pages; here they can only
  // be moved and hidden.
  publications: { layout: {}, content: {} },
  banners: { layout: {}, content: {} },
  applications: {
    layout: { paddingY: PADDING, width: WIDTH, align: ALIGN, bg: color(), headingColor: color(), textColor: color() },
    content: {
      heading: text(120),
      items: list(
        {
          title: text(120),
          subtitle: text(160),
          description: text(400),
          icon: image(),
          buttonLabel: text(60),
          link: link(),
        },
        8
      ),
    },
  },
  about: {
    layout: { paddingY: PADDING, width: WIDTH, align: ALIGN, bg: color(), headingColor: color(), textColor: color() },
    content: {
      heading: text(160),
      body: text(6000),
      image: image(),
      imagePosition: oneOf(["left", "right"]),
      showPattern: bool(),
      buttonLabel: text(60),
      buttonLink: link(),
    },
  },
  stats: {
    layout: { paddingY: PADDING, width: WIDTH, textColor: color() },
    content: {
      items: list(
        { value: text(20), label: text(80), icon: oneOf(STAT_ICONS), highlight: bool() },
        8
      ),
      gradientFrom: color(),
      gradientVia: color(),
      gradientTo: color(),
      highlightColor: color(),
    },
  },
  track: {
    layout: { paddingY: PADDING, width: WIDTH, align: ALIGN, bg: color(), headingColor: color(), textColor: color() },
    content: {
      heading: text(160),
      subtitle: text(300),
      placeholder: text(120),
      buttonLabel: text(40),
      bgImage: image(),
    },
  },
  footer: {
    layout: { bg: color(), headingColor: color(), textColor: color() },
    content: {
      description: text(400),
      address: text(400),
      phone: text(40),
      email: text(120),
      showMap: bool(),
      mapEmbedUrl: mapEmbed(),
      stripeColor: color(),
    },
  },
};

const SECTION_IDS = Object.keys(SECTION_SPECS);

// Section types the admin adds from the "Add section" picker. Unlike the built-ins above, any
// number of each can exist, so each instance carries its own id ("<type>-<random>") and type.
const FULL_LAYOUT = {
  paddingY: PADDING,
  width: WIDTH,
  align: ALIGN,
  bg: color(),
  headingColor: color(),
  textColor: color(),
};
const COLUMNS = oneOf(["2", "3", "4"]);

const CUSTOM_SPECS = {
  text: {
    layout: FULL_LAYOUT,
    content: { heading: text(200), subtitle: text(400), body: text(8000) },
  },
  imageText: {
    layout: FULL_LAYOUT,
    content: {
      heading: text(200),
      body: text(6000),
      image: image(),
      imagePosition: oneOf(["left", "right"]),
      buttonLabel: text(60),
      buttonLink: link(),
    },
  },
  cta: {
    layout: FULL_LAYOUT,
    content: {
      heading: text(200),
      body: text(600),
      buttonLabel: text(60),
      buttonLink: link(),
      bgImage: image(),
    },
  },
  cards: {
    layout: FULL_LAYOUT,
    content: {
      heading: text(200),
      subtitle: text(400),
      columns: COLUMNS,
      items: list(
        { icon: image(), title: text(160), text: text(600), buttonLabel: text(60), link: link() },
        12
      ),
    },
  },
  gallery: {
    layout: FULL_LAYOUT,
    content: {
      heading: text(200),
      subtitle: text(400),
      columns: COLUMNS,
      items: list({ image: image(), caption: text(200) }, 24),
    },
  },
  video: {
    layout: FULL_LAYOUT,
    content: { heading: text(200), subtitle: text(400), videoUrl: video() },
  },
  faq: {
    layout: FULL_LAYOUT,
    content: {
      heading: text(200),
      subtitle: text(400),
      items: list({ question: text(300), answer: text(3000) }, 20),
    },
  },
  notice: {
    layout: { bg: color(), textColor: color() },
    content: { text: text(300), linkLabel: text(60), link: link() },
  },
};

const MAX_CUSTOM_SECTIONS = 20;
const CUSTOM_ID = /^([a-zA-Z]+)-[a-z0-9]{4,16}$/;

// Control characters other than newline and tab have no business in page copy.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
// Image URLs end up in CSS url("...") as well as in src, so quotes, brackets, backslashes and
// whitespace are refused outright rather than escaped.
const WEB_URL = /^https?:\/\/[^\s"'()<>\\]+$/i;
const SITE_PATH = /^\/(?!\/)[^\s"'<>\\]*$/;
const ANCHOR = /^#[A-Za-z][\w-]*$/;
const BUILTIN_IMAGE = /^builtin:[a-z0-9-]{1,40}$/;
const MAP_EMBED = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>\\]+$/;
// YouTube only: watch, share, shorts and embed links. The frontend turns the id into a
// youtube-nocookie embed, so nothing but the 11-character id is ever used from the URL.
const YOUTUBE =
  /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}(?:[?&#][^\s"'<>\\]*)?$/;
const MAX_URL = 1000;

const normalizeValue = (spec, value) => {
  switch (spec.kind) {
    case "text":
      return typeof value === "string" ? value.replace(CONTROL_CHARS, "").slice(0, spec.max) : undefined;
    case "color":
      if (value === "") return "";
      return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : undefined;
    case "enum":
      return spec.values.includes(value) ? value : undefined;
    case "bool":
      return typeof value === "boolean" ? value : undefined;
    case "image":
      if (value === "") return "";
      if (typeof value !== "string" || value.length > MAX_URL) return undefined;
      return BUILTIN_IMAGE.test(value) || WEB_URL.test(value) ? value : undefined;
    case "link":
      if (value === "") return "";
      if (typeof value !== "string" || value.length > MAX_URL) return undefined;
      return WEB_URL.test(value) || SITE_PATH.test(value) || ANCHOR.test(value) ? value : undefined;
    case "mapEmbed":
      if (value === "") return "";
      return typeof value === "string" && value.length <= 2000 && MAP_EMBED.test(value)
        ? value
        : undefined;
    case "video":
      if (value === "") return "";
      return typeof value === "string" && value.length <= 300 && YOUTUBE.test(value) ? value : undefined;
    case "list":
      if (!Array.isArray(value)) return undefined;
      return value
        .slice(0, spec.max)
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item) => normalizeObject(spec.item, item));
    default:
      return undefined;
  }
};

const normalizeObject = (spec, input) => {
  const out = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const [key, fieldSpec] of Object.entries(spec)) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const value = normalizeValue(fieldSpec, input[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
};

/**
 * Turns whatever the editor posted into a storable config. `null` means "no customisation",
 * which the frontend renders as its defaults. Unknown sections are dropped, each built-in
 * section appears at most once, added sections are capped, and the footer is always last.
 *
 * @param {unknown} input
 * @returns {{ version: 1, theme: object, sections: object[] } | null}
 */
const normalizeHomepageConfig = (input) => {
  if (input === null || input === undefined) return null;
  if (typeof input !== "object" || Array.isArray(input)) return null;

  const seen = new Set();
  let custom = 0;
  const sections = [];
  for (const s of Array.isArray(input.sections) ? input.sections : []) {
    if (!s || typeof s !== "object" || typeof s.id !== "string" || seen.has(s.id)) continue;

    let spec = SECTION_SPECS[s.id];
    let type = null;
    if (!spec) {
      // An added section: its id must name its type, and the type must be one we know.
      const match = CUSTOM_ID.exec(s.id);
      if (!match || match[1] !== s.type || !CUSTOM_SPECS[s.type]) continue;
      if (custom >= MAX_CUSTOM_SECTIONS) continue;
      custom += 1;
      spec = CUSTOM_SPECS[s.type];
      type = s.type;
    }

    seen.add(s.id);
    sections.push({
      id: s.id,
      ...(type ? { type } : {}),
      visible: s.visible !== false,
      layout: normalizeObject(spec.layout, s.layout),
      content: normalizeObject(spec.content, s.content),
    });
  }

  const footerIndex = sections.findIndex((s) => s.id === "footer");
  if (footerIndex !== -1 && footerIndex !== sections.length - 1) {
    sections.push(sections.splice(footerIndex, 1)[0]);
  }

  return { version: 1, theme: normalizeObject(THEME_SPEC, input.theme), sections };
};

module.exports = {
  CUSTOM_SPECS,
  MAX_CUSTOM_SECTIONS,
  SECTION_IDS,
  SECTION_SPECS,
  THEME_SPEC,
  normalizeHomepageConfig,
};
