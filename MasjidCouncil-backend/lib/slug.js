// Slugs feed URLs like /resources/<publication>/<chapter>. Malayalam titles transliterate to
// nothing under a plain ASCII slugify, so callers that care about readable URLs (the seed
// script) pass their own slug; this is the fallback for titles typed in the admin editor.

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")   // strip combining accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

// Appends -2, -3 … until the slug is free. `taken` is anything with .has().
const uniqueSlug = (base, taken, fallback = "item") => {
  const root = slugify(base) || fallback;
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
};

module.exports = { slugify, uniqueSlug };
