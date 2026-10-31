import { linkKind } from './render';

// postMessage types between the customiser and the /homepage-preview frame.
export const PREVIEW_MESSAGES = {
  ready: 'mc-hp-ready',
  config: 'mc-hp-config',
  focus: 'mc-hp-focus',
  select: 'mc-hp-select',
};

// Widths the preview can be drawn at.
export const PREVIEW_DEVICES = [
  { id: 'phone', label: 'Phone', width: 375 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', width: 1280 },
];

/** The inline error a field shows for its current value, or '' when it is fine. */
export const fieldError = (field, value) => {
  if (field.kind === 'link' && value && !linkKind(value)) {
    return 'Use /page, #section or a full https:// address.';
  }
  if (field.pattern && typeof value === 'string' && !field.pattern.test(value)) {
    return field.patternMessage || 'Invalid value.';
  }
  return '';
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** How many values in a draft the API would drop on save, so the admin hears first. */
export const countInvalid = (config, { SECTION_META, THEME_GROUPS, sectionType }) => {
  let invalid = 0;
  const check = (fields, values) => {
    for (const field of fields) {
      const value = values?.[field.key];
      if (field.kind === 'list') {
        (Array.isArray(value) ? value : []).forEach((item) => check(field.fields, item));
      } else if (fieldError(field, value) || (field.kind === 'color' && value && !HEX_COLOR.test(value))) {
        invalid += 1;
      }
    }
  };
  check(THEME_GROUPS.flatMap((g) => g.fields), config.theme);
  for (const section of config.sections) {
    const meta = SECTION_META[sectionType(section)];
    if (!meta) continue;
    check(meta.content, section.content);
    check(meta.layout, section.layout);
  }
  return invalid;
};
