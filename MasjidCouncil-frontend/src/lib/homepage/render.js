import { useEffect } from 'react';
import { BUILTIN_IMAGES } from './defaults';
import { FONT_WEIGHTS, PRELOADED_FONTS } from './fields';

/**
 * Render-time guards and class maps for the customisable home page.
 *
 * The API already validates every stored value, but the preview renders the admin's unsaved
 * draft straight from the editor, so nothing here trusts its input: colours, links and image
 * URLs are checked again before they reach a style or an href.
 */

export const PADDING_CLASS = {
  none: 'py-0',
  xs: 'py-3 sm:py-4',
  sm: 'py-6 sm:py-8',
  md: 'py-9 sm:py-12',
  lg: 'py-14 sm:py-20',
};

export const WIDTH_CLASS = {
  narrow: 'max-w-4xl',
  normal: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export const ALIGN_CLASS = { left: 'text-left', center: 'text-center', right: 'text-right' };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const WEB_URL = /^https?:\/\/[^\s"'()<>\\]+$/i;
const SITE_PATH = /^\/(?!\/)[^\s"'<>\\]*$/;
const ANCHOR = /^#[A-Za-z][\w-]*$/;
const MAP_EMBED = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>\\]+$/;

/** A hex colour, or the fallback when the value is empty or not a colour. */
export const color = (value, fallback) => (typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback);

/** 'site' | 'anchor' | 'web' | null — null means the value must not be rendered as a link. */
export const linkKind = (value) => {
  if (typeof value !== 'string' || !value) return null;
  if (SITE_PATH.test(value)) return 'site';
  if (ANCHOR.test(value)) return 'anchor';
  if (WEB_URL.test(value)) return 'web';
  return null;
};

/** Resolves "builtin:<name>" to this build's asset; passes https URLs; anything else is ''. */
export const imageSrc = (value) => {
  if (typeof value !== 'string' || !value) return '';
  if (value.startsWith('builtin:')) return BUILTIN_IMAGES[value.slice(8)] || '';
  return WEB_URL.test(value) ? value : '';
};

export const cssUrl = (value) => {
  const src = imageSrc(value);
  return src ? `url("${src}")` : 'none';
};

export const mapEmbedSrc = (value) => (typeof value === 'string' && MAP_EMBED.test(value) ? value : '');

const FALLBACK_STACK = {
  malayalam: "'Noto Sans Malayalam', system-ui, sans-serif",
  latin: "system-ui, sans-serif",
  arabic: "'Noto Naskh Arabic', serif",
};

const fontFamily = (name, group) => `'${String(name).replace(/'/g, '')}', ${FALLBACK_STACK[group]}`;

/** CSS custom properties every section reads its theme from. */
export const themeVars = (theme) => ({
  '--hp-primary': color(theme.primary, '#15803d'),
  '--hp-primary-hover': color(theme.primaryHover, '#166534'),
  '--hp-heading': color(theme.heading, '#14532d'),
  '--hp-text': color(theme.text, '#111827'),
  '--hp-muted': color(theme.muted, '#6b7280'),
  '--hp-accent': color(theme.accent, '#9ece88'),
  '--hp-page-bg': color(theme.pageBg, '#ffffff'),
  '--hp-font-heading': fontFamily(theme.fontHeading, 'malayalam'),
  '--hp-font-body': fontFamily(theme.fontBody, 'malayalam'),
  '--hp-font-latin': fontFamily(theme.fontLatin, 'latin'),
  '--hp-font-hero': fontFamily(theme.fontHero, 'latin'),
  '--hp-font-arabic': fontFamily(theme.fontArabic, 'arabic'),
});

const FONT_KEYS = ['fontHeading', 'fontBody', 'fontLatin', 'fontHero', 'fontArabic'];

/**
 * Loads the theme's fonts from Google Fonts. index.html already fetches the defaults, so
 * only a font the admin picked on top of those costs a request — once per family per tab.
 */
export const useThemeFonts = (theme) => {
  const families = FONT_KEYS.map((key) => theme[key]).filter((f) => f && !PRELOADED_FONTS.has(f));
  const signature = [...new Set(families)].sort().join('|');

  useEffect(() => {
    if (!signature) return;
    for (const family of signature.split('|')) {
      const id = `hp-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      const weights = FONT_WEIGHTS[family];
      // Not in the allowlist: never build a request from an unknown name.
      if (!weights) continue;
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
      document.head.appendChild(link);
    }
  }, [signature]);
};

const YOUTUBE_ID = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

/**
 * A privacy-enhanced YouTube embed for a pasted watch/share/shorts link, or '' when the value
 * is not one. Only the 11-character video id is taken from the input.
 */
export const youtubeEmbed = (value) => {
  const match = typeof value === 'string' ? YOUTUBE_ID.exec(value) : null;
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0` : '';
};
