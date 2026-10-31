import heroImage from '../../assets/banner3-De89_Ox0.webp';
import aboutImage from '../../assets/inside.webp';
import trackImage from '../../assets/btm-bg.webp';
import affiliationIcon from '../../assets/mosque.webp';
import welfareIcon from '../../assets/moududi2.webp';
import mosqueFundIcon from '../../assets/investment.webp';

/**
 * The home page as it ships: every section, its copy, colours and spacing. The customiser edits
 * a copy of this; the API stores only what the admin saved, and mergeHomepage() lays that over
 * these defaults — so a field added in a later release still has a value on pages saved earlier.
 *
 * Bundled images are referenced as "builtin:<name>" rather than by URL. Vite fingerprints
 * asset URLs per build, so a stored URL would break on the next deploy; the token is resolved
 * to the current build's file at render time.
 */

export const BUILTIN_IMAGES = {
  hero: heroImage,
  about: aboutImage,
  track: trackImage,
  affiliation: affiliationIcon,
  welfare: welfareIcon,
  mosquefund: mosqueFundIcon,
};

export const DEFAULT_THEME = {
  primary: '#15803d',
  primaryHover: '#166534',
  heading: '#14532d',
  text: '#111827',
  muted: '#6b7280',
  accent: '#9ece88',
  pageBg: '#ffffff',
  fontHeading: 'Anek Malayalam',
  fontBody: 'Noto Sans Malayalam',
  fontLatin: 'Poppins',
  fontHero: 'Plus Jakarta Sans',
  fontArabic: 'Amiri',
};

// Layout colours left empty fall back to the theme.
const DEFAULT_SECTIONS = [
  {
    id: 'hero',
    visible: true,
    layout: { align: 'center', bg: '#186b3a', headingColor: '#f8f3d8', textColor: '#ffffff' },
    content: {
      ayah: 'وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا',
      translation: '"And the mosques are for Allah, so do not invoke with Allah anyone."',
      reference: '(Surah Al-Jinn : 18)',
      titleMl: 'മസ്ജിദുകൾ മികവിന്റെ കേന്ദ്രങ്ങൾ',
      titleEn: 'Making Mosques Centers of Excellence',
      bgImage: 'builtin:hero',
    },
  },
  { id: 'publications', visible: true, layout: {}, content: {} },
  {
    id: 'applications',
    visible: true,
    layout: { paddingY: 'md', width: 'normal', align: 'center', bg: '#f1f7ef', headingColor: '', textColor: '' },
    content: {
      heading: 'അപേക്ഷകൾ',
      items: [
        {
          title: 'Masjid Affiliation',
          subtitle: 'മസ്ജിദ് അഫിലിയേഷൻ',
          description: 'Apply for masjid affiliation with Masjid Council Kerala.',
          icon: 'builtin:affiliation',
          buttonLabel: 'Start Application',
          link: '/affiliation',
        },
        {
          title: 'Imam Muaddin Welfare Fund',
          subtitle: 'ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി',
          description: 'Apply for welfare assistance for masjid staff.',
          icon: 'builtin:welfare',
          buttonLabel: 'Start Application',
          link: '/medical-aid',
        },
        {
          title: 'Masjid Fund',
          subtitle: 'മസ്ജിദ് ഫണ്ട്',
          description: 'Apply for financial assistance for masjid maintenance and repairs.',
          icon: 'builtin:mosquefund',
          buttonLabel: 'Start Application',
          link: '/mosque-fund',
        },
      ],
    },
  },
  { id: 'banners', visible: true, layout: {}, content: {} },
  {
    id: 'about',
    visible: true,
    layout: { paddingY: 'md', width: 'wide', align: 'left', bg: '', headingColor: '', textColor: '' },
    content: {
      heading: 'മസ്ജിദ് കൗൺസിൽ കേരള',
      body: [
        'മസ്ജിദുകളെ മികവിൻ്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.',
        'മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുകയും ആവശ്യമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ നൽകുകയും ചെയ്യുക, ഖുത്ബയും ഇമാമത്തും നിർവ്വഹിക്കുവാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലനം നൽകുക, നിലവിൽ മസ്ജിദുകളിൽ സേവനം ചെയ്തുവരുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുന്നതിനാവശ്യമായ പദ്ധതികൾ നടപ്പിലാക്കുക, മസ്ജിദ്, മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് ആവശ്യമായ പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ഉദ്ദേശ്യ ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്.',
        'കൂടാതെ ഖത്വീബുമാർക്ക് ഖുത്ബ നിർവ്വഹിക്കുന്നതിന് സഹായകമാകും വിധം വിവിധ വിഷയങ്ങളിൽ സിനോപ്സിസുകൾ തയ്യാറാക്കി നൽകുകയും ചെയ്യുന്നുണ്ട്.',
      ].join('\n\n'),
      image: 'builtin:about',
      imagePosition: 'left',
      showPattern: true,
      buttonLabel: 'Know More About Us',
      buttonLink: '/about',
    },
  },
  {
    id: 'stats',
    visible: true,
    layout: { paddingY: 'xs', width: 'normal', textColor: '#dcfce7' },
    content: {
      items: [
        { value: '550', label: 'ജുമാമസ്ജിദുകൾ', icon: 'Landmark', highlight: false },
        { value: '161', label: 'നമസ്കാര പള്ളികൾ', icon: 'Building2', highlight: false },
        { value: '711', label: 'ആകെ', icon: 'Layers', highlight: true },
        { value: '62', label: 'സമ്പൂർണ്ണ മഹല്ലുകൾ', icon: 'BadgeCheck', highlight: false },
        { value: '200', label: 'ഭാഗിക മഹല്ല്', icon: 'PieChart', highlight: false },
      ],
      gradientFrom: '#78b247',
      gradientVia: '#2f6b2f',
      gradientTo: '#17532b',
      highlightColor: '#f8f3d8',
    },
  },
  {
    id: 'track',
    visible: true,
    layout: { paddingY: 'sm', width: 'wide', align: 'center', bg: '#eef4ec', headingColor: '', textColor: '' },
    content: {
      heading: 'Track Your Application',
      subtitle: 'Enter your application reference number or the mobile number used during registration',
      placeholder: 'Enter reference number or mobile number',
      buttonLabel: 'Track Status',
      bgImage: 'builtin:track',
    },
  },
  {
    id: 'footer',
    visible: true,
    layout: { bg: '#477d33', headingColor: '#ffffff', textColor: '#dcfce7' },
    content: {
      description:
        'Working for the development of mosques and the welfare of the Muslim community across Kerala.',
      address: 'Masjid Council Kerala,\nHira Centre, PB No. 833,\nMavoor Road, Kozhikode - 4,\n673004',
      phone: '+91 95624 78805',
      email: 'masjidcouncilkerala@gmail.com',
      showMap: true,
      mapEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3913.0048853421154!2d75.7886534!3d11.2610504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTHCsDE1JzM5LjgiTiA3NcKwNDcnMTkuMiJF!5e0!3m2!1sen!2sbh!4v1748684741914!5m2!1sen!2sbh',
      stripeColor: '#304e26',
    },
  },
];

export const DEFAULT_HOMEPAGE = { version: 1, theme: DEFAULT_THEME, sections: DEFAULT_SECTIONS };

// Sections the admin adds from the "Add section" picker. Any number of each can exist, so an
// instance has its own id ("<type>-<random>") plus its type; these are its starting values.
const EMPTY_LAYOUT = { paddingY: 'md', width: 'normal', align: 'center', bg: '', headingColor: '', textColor: '' };

export const SECTION_TEMPLATES = {
  text: {
    layout: { ...EMPTY_LAYOUT, width: 'narrow' },
    content: {
      heading: 'New section',
      subtitle: '',
      body: 'Write your text here. Leave a blank line between paragraphs.',
    },
  },
  imageText: {
    layout: { ...EMPTY_LAYOUT, width: 'wide', align: 'left' },
    content: {
      heading: 'New section',
      body: 'Write your text here.',
      image: 'builtin:about',
      imagePosition: 'left',
      buttonLabel: '',
      buttonLink: '',
    },
  },
  cta: {
    layout: { ...EMPTY_LAYOUT, bg: '#1f6b3a', headingColor: '#ffffff', textColor: '#e7f5ea' },
    content: {
      heading: 'Join the programme',
      body: 'One line that tells visitors why they should act.',
      buttonLabel: 'Learn more',
      buttonLink: '/about',
      bgImage: '',
    },
  },
  cards: {
    layout: { ...EMPTY_LAYOUT, bg: '#f8faf7' },
    content: {
      heading: 'Our services',
      subtitle: '',
      columns: '3',
      items: [
        { icon: 'builtin:affiliation', title: 'First card', text: 'A short description.', buttonLabel: '', link: '' },
        { icon: 'builtin:welfare', title: 'Second card', text: 'A short description.', buttonLabel: '', link: '' },
        { icon: 'builtin:mosquefund', title: 'Third card', text: 'A short description.', buttonLabel: '', link: '' },
      ],
    },
  },
  gallery: {
    layout: { ...EMPTY_LAYOUT, width: 'wide' },
    content: {
      heading: 'Gallery',
      subtitle: '',
      columns: '2',
      items: [
        { image: 'builtin:about', caption: '' },
        { image: 'builtin:hero', caption: '' },
      ],
    },
  },
  video: {
    layout: { ...EMPTY_LAYOUT },
    content: { heading: 'Watch', subtitle: '', videoUrl: '' },
  },
  faq: {
    layout: { ...EMPTY_LAYOUT, width: 'narrow' },
    content: {
      heading: 'Frequently asked questions',
      subtitle: '',
      items: [
        { question: 'How do I apply?', answer: 'Choose an application above and fill in the form.' },
        { question: 'How do I check my application?', answer: 'Use Track Your Application with your reference or mobile number.' },
      ],
    },
  },
  notice: {
    layout: { bg: '#fef3c7', textColor: '#78350f' },
    content: { text: 'An important announcement for visitors.', linkLabel: '', link: '' },
  },
};

export const MAX_CUSTOM_SECTIONS = 20;
const CUSTOM_ID = /^([a-zA-Z]+)-[a-z0-9]{4,16}$/;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

/** A section's type: built-ins are their own type, added sections say theirs. */
export const sectionType = (section) => section.type || section.id;

export const isCustomSection = (section) => Boolean(section.type);

/** The values a section starts from (and resets to). */
export const sectionDefaults = (section) =>
  isCustomSection(section)
    ? { id: section.id, type: section.type, visible: true, ...clone(SECTION_TEMPLATES[section.type]) }
    : clone(DEFAULT_SECTIONS.find((s) => s.id === section.id));

/** A fresh section of an addable type, with an id no other section has. */
export const newSection = (type, existing) => {
  const taken = new Set(existing.map((s) => s.id));
  let id;
  do {
    id = `${type}-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`;
  } while (taken.has(id));
  return { id, type, visible: true, ...clone(SECTION_TEMPLATES[type]) };
};

const builtin = (id) => DEFAULT_SECTIONS.find((s) => s.id === id);

/**
 * Lays a stored config over the defaults. Unknown sections are ignored, built-in sections the
 * stored copy lacks are added back in their default slot, added sections keep their place,
 * and the footer always ends the page.
 *
 * @param {unknown} stored
 * @returns {{ version: 1, theme: typeof DEFAULT_THEME, sections: object[] }}
 */
export const mergeHomepage = (stored) => {
  if (!isObject(stored)) return clone(DEFAULT_HOMEPAGE);

  const theme = { ...DEFAULT_THEME };
  if (isObject(stored.theme)) {
    for (const key of Object.keys(DEFAULT_THEME)) {
      // An empty theme value has nothing to fall back to, so it keeps the default.
      if (typeof stored.theme[key] === 'string' && stored.theme[key]) theme[key] = stored.theme[key];
    }
  }

  const seen = new Set();
  const sections = [];
  let custom = 0;
  for (const s of Array.isArray(stored.sections) ? stored.sections : []) {
    if (!isObject(s) || typeof s.id !== 'string' || seen.has(s.id)) continue;
    let base = builtin(s.id);
    if (base) {
      base = { id: base.id, layout: base.layout, content: base.content };
    } else {
      const match = CUSTOM_ID.exec(s.id);
      const template = match && match[1] === s.type && SECTION_TEMPLATES[s.type];
      if (!template || custom >= MAX_CUSTOM_SECTIONS) continue;
      custom += 1;
      base = { id: s.id, type: s.type, layout: template.layout, content: template.content };
    }
    seen.add(s.id);
    sections.push({
      ...base,
      visible: s.visible !== false,
      layout: { ...base.layout, ...(isObject(s.layout) ? s.layout : {}) },
      content: { ...clone(base.content), ...(isObject(s.content) ? s.content : {}) },
    });
  }

  DEFAULT_SECTIONS.forEach((base, index) => {
    if (seen.has(base.id)) return;
    // Slot it after whichever section precedes it by default, so a new section lands where
    // it was designed to go rather than at the bottom.
    const previous = DEFAULT_SECTIONS.slice(0, index).reverse().find((p) => seen.has(p.id));
    const at = previous ? sections.findIndex((x) => x.id === previous.id) + 1 : 0;
    sections.splice(at, 0, clone(base));
    seen.add(base.id);
  });

  const footerIndex = sections.findIndex((s) => s.id === 'footer');
  if (footerIndex !== sections.length - 1) sections.push(sections.splice(footerIndex, 1)[0]);

  return { version: 1, theme, sections };
};
