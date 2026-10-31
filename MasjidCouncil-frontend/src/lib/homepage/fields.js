/**
 * What the customiser lets the admin edit, and how each control is labelled.
 *
 * The keys and allowed values here mirror MasjidCouncil-backend/lib/homepageConfig.js, which
 * is the authority: a value this file offers but the API does not accept is silently dropped
 * on save. Keep the two in step when adding a field.
 */

// Google Fonts rejects a request for a weight the family does not ship, so each font lists
// its own. index.html already loads the preloaded ones.
export const FONTS = {
  latin: [
    { name: 'Poppins', weights: '400;500;600;700' },
    { name: 'Plus Jakarta Sans', weights: '400;500;600;700' },
    { name: 'Inter', weights: '400;500;600;700' },
    { name: 'Montserrat', weights: '400;500;600;700' },
    { name: 'Lato', weights: '400;700' },
    { name: 'Open Sans', weights: '400;500;600;700' },
    { name: 'Roboto', weights: '400;500;700' },
    { name: 'Nunito', weights: '400;500;600;700' },
    { name: 'Merriweather', weights: '400;700' },
    { name: 'Playfair Display', weights: '400;500;600;700' },
    { name: 'Cinzel', weights: '400;500;600;700' },
  ],
  malayalam: [
    { name: 'Anek Malayalam', weights: '400;500;600;700' },
    { name: 'Noto Sans Malayalam', weights: '400;500;600;700' },
    { name: 'Noto Serif Malayalam', weights: '400;500;600;700' },
    { name: 'Manjari', weights: '400;700' },
    { name: 'Gayathri', weights: '400;700' },
    { name: 'Baloo Chettan 2', weights: '400;500;600;700' },
    { name: 'Chilanka', weights: '400' },
  ],
  arabic: [
    { name: 'Amiri', weights: '400;700' },
    { name: 'Noto Naskh Arabic', weights: '400;500;600;700' },
    { name: 'Scheherazade New', weights: '400;500;600;700' },
    { name: 'Lateef', weights: '400;500;600;700' },
    { name: 'Reem Kufi', weights: '400;500;600;700' },
    { name: 'Cairo', weights: '400;500;600;700' },
  ],
};

export const FONT_WEIGHTS = Object.fromEntries(
  Object.values(FONTS)
    .flat()
    .map((font) => [font.name, font.weights])
);

export const PRELOADED_FONTS = new Set(['Poppins', 'Anek Malayalam', 'Noto Sans Malayalam', 'Cinzel']);

export const STAT_ICON_NAMES = [
  'Landmark',
  'Building2',
  'Layers',
  'BadgeCheck',
  'PieChart',
  'Users',
  'Home',
  'BookOpen',
  'HeartHandshake',
  'MapPin',
  'Star',
  'Award',
  'GraduationCap',
  'CalendarDays',
];

const options = (pairs) => pairs.map(([value, label]) => ({ value, label }));

const LAYOUT = {
  paddingY: {
    key: 'paddingY',
    label: 'Vertical spacing',
    kind: 'select',
    options: options([
      ['none', 'None'],
      ['xs', 'Extra small'],
      ['sm', 'Small'],
      ['md', 'Medium'],
      ['lg', 'Large'],
    ]),
  },
  width: {
    key: 'width',
    label: 'Content width',
    kind: 'select',
    options: options([
      ['narrow', 'Narrow'],
      ['normal', 'Normal'],
      ['wide', 'Wide'],
      ['full', 'Full width'],
    ]),
  },
  align: {
    key: 'align',
    label: 'Heading alignment',
    kind: 'select',
    options: options([
      ['left', 'Left'],
      ['center', 'Centre'],
      ['right', 'Right'],
    ]),
  },
  bg: { key: 'bg', label: 'Background colour', kind: 'color' },
  headingColor: { key: 'headingColor', label: 'Heading colour', kind: 'color' },
  textColor: { key: 'textColor', label: 'Text colour', kind: 'color' },
};

// layout('paddingY', ['bg', { label: 'Card background' }]) — a key, or a key plus overrides.
const layout = (...keys) =>
  keys.map((k) => (typeof k === 'string' ? LAYOUT[k] : { ...LAYOUT[k[0]], ...k[1] }));

const LINK_HINT = 'A page on this site (/about), a section (#about-section) or a full https:// address.';

const FULL_LAYOUT = layout('paddingY', 'width', 'align', 'bg', 'headingColor', 'textColor');
const SIDE_OPTIONS = options([
  ['left', 'Left'],
  ['right', 'Right'],
]);
const COLUMN_OPTIONS = options([
  ['2', '2'],
  ['3', '3'],
  ['4', '4'],
]);
const YOUTUBE_PATTERN =
  /^(|https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}(?:[?&#]\S*)?)$/;

/** Section types the "Add section" picker offers, in the order it lists them. */
export const ADDABLE_TYPES = ['text', 'imageText', 'cta', 'cards', 'gallery', 'video', 'faq', 'notice'];

export const THEME_GROUPS = [
  {
    title: 'Colours',
    fields: [
      { key: 'primary', label: 'Buttons', kind: 'color', required: true },
      { key: 'primaryHover', label: 'Buttons on hover', kind: 'color', required: true },
      { key: 'heading', label: 'Headings', kind: 'color', required: true },
      { key: 'text', label: 'Body text', kind: 'color', required: true },
      { key: 'muted', label: 'Secondary text', kind: 'color', required: true },
      { key: 'accent', label: 'Heading underline', kind: 'color', required: true },
      { key: 'pageBg', label: 'Page background', kind: 'color', required: true },
    ],
  },
  {
    title: 'Fonts',
    fields: [
      { key: 'fontHeading', label: 'Malayalam headings', kind: 'font', fontGroup: 'malayalam' },
      { key: 'fontBody', label: 'Malayalam body text', kind: 'font', fontGroup: 'malayalam' },
      { key: 'fontLatin', label: 'English text', kind: 'font', fontGroup: 'latin' },
      { key: 'fontHero', label: 'Hero English lines', kind: 'font', fontGroup: 'latin' },
      { key: 'fontArabic', label: 'Arabic (ayah)', kind: 'font', fontGroup: 'arabic' },
    ],
  },
];

export const SECTION_META = {
  hero: {
    label: 'Hero',
    hint: 'The top of the page: ayah and title over the large image.',
    layout: layout(
      ['align', { label: 'Text alignment' }],
      ['bg', { label: 'Background behind the image' }],
      ['headingColor', { label: 'Malayalam title colour' }],
      ['textColor', { label: 'Other text colour' }]
    ),
    content: [
      { key: 'bgImage', label: 'Background image', kind: 'image', hint: 'Wide image, about 1750 × 830 px.' },
      { key: 'ayah', label: 'Ayah (Arabic)', kind: 'textarea', dir: 'rtl', hint: 'Leave empty to hide.' },
      { key: 'translation', label: 'Translation', kind: 'textarea', hint: 'Leave empty to hide.' },
      { key: 'reference', label: 'Reference', kind: 'text', hint: 'Leave empty to hide.' },
      { key: 'titleMl', label: 'Malayalam title', kind: 'text' },
      { key: 'titleEn', label: 'English line', kind: 'text' },
    ],
  },
  publications: {
    label: 'Publications',
    hint: 'Book cards. Their content is edited on the Publications page.',
    managedAt: 'publications',
    layout: [],
    content: [],
  },
  applications: {
    label: 'Applications',
    hint: 'The application cards (അപേക്ഷകൾ).',
    layout: layout('paddingY', 'width', 'align', 'bg', 'headingColor', ['textColor', { label: 'Card title colour' }]),
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      {
        key: 'items',
        label: 'Cards',
        itemName: 'card',
        kind: 'list',
        max: 8,
        itemLabel: (item, index) => item.title || `Card ${index + 1}`,
        newItem: {
          title: 'New application',
          subtitle: '',
          description: '',
          icon: 'builtin:affiliation',
          buttonLabel: 'Start Application',
          link: '/',
        },
        fields: [
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'subtitle', label: 'Malayalam subtitle', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'textarea' },
          { key: 'icon', label: 'Icon', kind: 'image', hint: 'Square image, shown in the green circle.' },
          { key: 'buttonLabel', label: 'Button label', kind: 'text' },
          { key: 'link', label: 'Button link', kind: 'link', hint: LINK_HINT },
        ],
      },
    ],
  },
  banners: {
    label: 'Banners',
    hint: 'The banner carousel. Its images are managed on the Banners page.',
    managedAt: 'banners',
    layout: [],
    content: [],
  },
  about: {
    label: 'About',
    hint: 'Image with the council introduction.',
    layout: layout('paddingY', 'width', 'align', 'bg', 'headingColor', 'textColor'),
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Text', kind: 'textarea', rows: 10, hint: 'Leave a blank line between paragraphs.' },
      { key: 'image', label: 'Image', kind: 'image' },
      {
        key: 'imagePosition',
        label: 'Image side (desktop)',
        kind: 'select',
        options: options([
          ['left', 'Left'],
          ['right', 'Right'],
        ]),
      },
      { key: 'showPattern', label: 'Show the background pattern', kind: 'toggle' },
      { key: 'buttonLabel', label: 'Button label', kind: 'text', hint: 'Leave empty to hide the button.' },
      { key: 'buttonLink', label: 'Button link', kind: 'link', hint: LINK_HINT },
    ],
  },
  stats: {
    label: 'Statistics',
    hint: 'The green strip of numbers.',
    layout: layout('paddingY', 'width', ['textColor', { label: 'Label colour' }]),
    content: [
      {
        key: 'items',
        label: 'Numbers',
        itemName: 'number',
        kind: 'list',
        max: 8,
        itemLabel: (item, index) => (item.value ? `${item.value} — ${item.label}` : `Number ${index + 1}`),
        newItem: { value: '0', label: '', icon: 'Landmark', highlight: false },
        fields: [
          { key: 'value', label: 'Number', kind: 'text' },
          { key: 'label', label: 'Label', kind: 'text' },
          {
            key: 'icon',
            label: 'Icon',
            kind: 'select',
            options: STAT_ICON_NAMES.map((name) => ({ value: name, label: name })),
          },
          { key: 'highlight', label: 'Highlight this number', kind: 'toggle' },
        ],
      },
      { key: 'gradientFrom', label: 'Gradient start', kind: 'color', required: true },
      { key: 'gradientVia', label: 'Gradient middle', kind: 'color', required: true },
      { key: 'gradientTo', label: 'Gradient end', kind: 'color', required: true },
      { key: 'highlightColor', label: 'Highlighted number colour', kind: 'color', required: true },
    ],
  },
  track: {
    label: 'Track application',
    hint: 'The application status lookup.',
    layout: layout('paddingY', 'width', 'align', ['bg', { label: 'Card background' }], 'headingColor', 'textColor'),
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { key: 'placeholder', label: 'Input placeholder', kind: 'text' },
      { key: 'buttonLabel', label: 'Button label', kind: 'text' },
      { key: 'bgImage', label: 'Background image', kind: 'image', hint: 'Wide strip, pinned to the bottom of the card.' },
    ],
  },
  footer: {
    label: 'Footer',
    hint: 'Contact details at the bottom. Always the last section.',
    pinned: true,
    layout: layout('bg', 'headingColor', 'textColor'),
    content: [
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'address', label: 'Address', kind: 'textarea', hint: 'One line per row.' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'email', label: 'Email', kind: 'text' },
      { key: 'showMap', label: 'Show the map (desktop)', kind: 'toggle' },
      {
        key: 'mapEmbedUrl',
        label: 'Google Maps embed URL',
        kind: 'text',
        hint: 'Google Maps → Share → Embed a map → copy the src="…" address.',
        pattern: /^(|https:\/\/www\.google\.com\/maps\/embed\?\S+)$/,
        patternMessage: 'Must start with https://www.google.com/maps/embed?',
      },
      { key: 'stripeColor', label: 'Bottom stripe colour', kind: 'color', required: true },
    ],
  },

  /* ---------------------------------------------------- sections added by the admin */

  text: {
    label: 'Text',
    hint: 'A heading and paragraphs.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text', hint: 'Leave empty to hide.' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', rows: 2 },
      { key: 'body', label: 'Text', kind: 'textarea', rows: 10, hint: 'Leave a blank line between paragraphs.' },
    ],
  },
  imageText: {
    label: 'Image + text',
    hint: 'A picture beside a heading, text and a button.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Text', kind: 'textarea', rows: 8, hint: 'Leave a blank line between paragraphs.' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'imagePosition', label: 'Image side (desktop)', kind: 'select', options: SIDE_OPTIONS },
      { key: 'buttonLabel', label: 'Button label', kind: 'text', hint: 'Leave empty to hide the button.' },
      { key: 'buttonLink', label: 'Button link', kind: 'link', hint: LINK_HINT },
    ],
  },
  cta: {
    label: 'Call to action',
    hint: 'A bold strip with a heading and one button.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Text', kind: 'textarea', rows: 3 },
      { key: 'buttonLabel', label: 'Button label', kind: 'text', hint: 'Leave empty to hide the button.' },
      { key: 'buttonLink', label: 'Button link', kind: 'link', hint: LINK_HINT },
      { key: 'bgImage', label: 'Background image (optional)', kind: 'image', hint: 'Darkened so the text stays readable.' },
    ],
  },
  cards: {
    label: 'Cards',
    hint: 'A grid of cards: services, programmes, departments.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', rows: 2 },
      { key: 'columns', label: 'Cards per row (desktop)', kind: 'select', options: COLUMN_OPTIONS },
      {
        key: 'items',
        label: 'Cards',
        itemName: 'card',
        kind: 'list',
        max: 12,
        itemLabel: (item, index) => item.title || `Card ${index + 1}`,
        newItem: { icon: '', title: 'New card', text: '', buttonLabel: '', link: '' },
        fields: [
          { key: 'icon', label: 'Icon or image', kind: 'image' },
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'text', label: 'Text', kind: 'textarea' },
          { key: 'buttonLabel', label: 'Button label', kind: 'text', hint: 'Leave empty for no button.' },
          { key: 'link', label: 'Button link', kind: 'link', hint: LINK_HINT },
        ],
      },
    ],
  },
  gallery: {
    label: 'Gallery',
    hint: 'A grid of photos with captions.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', rows: 2 },
      { key: 'columns', label: 'Photos per row (desktop)', kind: 'select', options: COLUMN_OPTIONS },
      {
        key: 'items',
        label: 'Photos',
        itemName: 'photo',
        kind: 'list',
        max: 24,
        itemLabel: (item, index) => item.caption || `Photo ${index + 1}`,
        newItem: { image: '', caption: '' },
        fields: [
          { key: 'image', label: 'Photo', kind: 'image' },
          { key: 'caption', label: 'Caption', kind: 'text' },
        ],
      },
    ],
  },
  video: {
    label: 'Video',
    hint: 'A YouTube video with a heading.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', rows: 2 },
      {
        key: 'videoUrl',
        label: 'YouTube link',
        kind: 'text',
        hint: 'Paste the link from YouTube → Share, e.g. https://youtu.be/…',
        pattern: YOUTUBE_PATTERN,
        patternMessage: 'Paste a YouTube link (youtube.com/watch?v=… or youtu.be/…).',
      },
    ],
  },
  faq: {
    label: 'FAQ',
    hint: 'Questions that open to show their answers.',
    custom: true,
    layout: FULL_LAYOUT,
    content: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea', rows: 2 },
      {
        key: 'items',
        label: 'Questions',
        itemName: 'question',
        kind: 'list',
        max: 20,
        itemLabel: (item, index) => item.question || `Question ${index + 1}`,
        newItem: { question: 'New question', answer: '' },
        fields: [
          { key: 'question', label: 'Question', kind: 'text' },
          { key: 'answer', label: 'Answer', kind: 'textarea', rows: 4 },
        ],
      },
    ],
  },
  notice: {
    label: 'Notice bar',
    hint: 'A thin announcement strip with an optional link.',
    custom: true,
    layout: layout('bg', 'textColor'),
    content: [
      { key: 'text', label: 'Announcement', kind: 'textarea', rows: 2 },
      { key: 'linkLabel', label: 'Link label', kind: 'text', hint: 'Leave empty for no link.' },
      { key: 'link', label: 'Link', kind: 'link', hint: LINK_HINT },
    ],
  },
};
