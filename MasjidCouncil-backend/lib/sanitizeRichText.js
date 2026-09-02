const sanitizeHtml = require("sanitize-html");
const { isUploadedDocumentUrl } = require("../utils/documentUrl");

// Chapter bodies come from the admin rich-text editor, so the HTML is attacker-controlled
// the moment an admin account is compromised — and it is rendered on the public site with
// dangerouslySetInnerHTML. Sanitizing here, on write, is what makes that render safe: the
// public reader ships no sanitizer of its own, it trusts what this produced.
//
// Everything not named below is dropped, including <style>, event handlers and any tag the
// editor has no button for.

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "a", "blockquote", "hr",
  "img", "figure", "figcaption",
];

const sanitizeRichText = (html) => {
  if (typeof html !== "string" || html.length === 0) return "";

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    // Anything else (javascript:, data:, vbscript:) is stripped along with the attribute.
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // <script>/<style> bodies are text nodes; without this they survive as visible text.
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
    // Drop the tag *and* its children, so a stripped <form> does not leave its inputs behind.
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    transformTags: {
      // Never trust an incoming rel — overwrite it. target=_blank without noopener hands the
      // opened page a window.opener reference back to the reader.
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
      }),
      // Only images our own upload endpoint could have produced. A remote <img> is a
      // tracking pixel that fires for every visitor of a public page.
      img: (tagName, attribs) =>
        isUploadedDocumentUrl(attribs.src)
          ? { tagName: "img", attribs }
          : { tagName: "img", attribs: {} },
    },
  });
};

module.exports = { sanitizeRichText, ALLOWED_TAGS };
