// Turns the plain-text exports of the council's printed books into chapter HTML.
//
// The source files came out of a DTP layout, so they carry three kinds of damage:
//
//   1. Legacy chillu spellings — ള + virama + ZWJ where modern Malayalam uses the atomic ൾ.
//   2. Malayalam *digits* standing in for chillu letters (൪ for ർ, ൯ for ൻ), a typing habit
//      from the pre-Unicode fonts the book was set in.
//   3. Hard wrapping at the printed line width, with no hyphens. A line that ends mid-word
//      is indistinguishable from one that ends between two words, so those breaks cannot be
//      resolved by rule — the reviewed decisions live in scripts/data/joins-*.json and are
//      passed in as `spaceBreaks`. Every break not listed there is closed up.
//
// Paragraphs, by contrast, *are* mechanical: the layout only ever ended a line on a full
// stop when the paragraph itself ended, so a line ending in . ? or ! closes the paragraph.

const ZWJ = "‍";
const ZWNJ = "‌";
const VIRAMA = "്";

// base consonant -> atomic chillu
const CHILLU = [
  ["ണ", "ൺ"], // ണ -> ൺ
  ["ന", "ൻ"], // ന -> ൻ
  ["ര", "ർ"], // ര -> ർ
  ["ല", "ൽ"], // ല -> ൽ
  ["ള", "ൾ"], // ള -> ൾ
  ["ക", "ൿ"], // ക -> ൿ
];

// Malayalam digits mistyped for the chillu they resemble in the old print fonts.
const DIGIT_AS_CHILLU = [
  ["൪", "ർ"], // ൪ -> ർ
  ["൯", "ൻ"], // ൯ -> ൻ
];

const normaliseText = (input) => {
  let out = String(input == null ? "" : input).replace(/\r\n?/g, "\n");
  for (const [base, chillu] of CHILLU) {
    out = out.split(base + VIRAMA + ZWJ).join(chillu);
  }
  for (const [digit, chillu] of DIGIT_AS_CHILLU) {
    out = out.split(digit).join(chillu);
  }
  // Two viramas in a row are never valid. The book has 12 of them, all where a
  // virama + ZWNJ was meant — "ഇസ്്ലാമിക" for "ഇസ്‌ലാമിക".
  out = out.split(VIRAMA + VIRAMA).join(VIRAMA + ZWNJ);
  return out;
};

// The layout used runs of spaces and tabs to fake indentation; they mean nothing in HTML and
// would show up as gaps once the text reflows.
const tidy = (s) => s.replace(/[ \t ]+/g, " ").trim();

const escapeHtml = (s) =>
  tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const endsParagraph = (line) => /[.?!]["'”’]?$/.test(line.trim());
// A comma or colon at the line end is always a real word boundary, never a split word.
const endsWithSoftPunctuation = (line) => /[,;:]$/.test(line.trim());

const BOLD = /^\*(.+)\*$/;

// Ordered/unordered list markers, most specific first. Roman numerals must be tested before
// lower-alpha or "i." is read as the letter i.
const LIST_PATTERNS = [
  { type: "decimal", re: /^(\d{1,2})[.)]\s+/ },
  { type: "upper-roman", re: /^([IVX]{1,5})\.\s+/ },
  { type: "lower-alpha", re: /^([a-z])[.)]\s+/ },
  { type: "bullet", re: /^[-•]\s+/ },
];

const listMarker = (line) => {
  const t = line.trim();
  for (const { type, re } of LIST_PATTERNS) {
    const m = t.match(re);
    if (m) return { type, text: t.slice(m[0].length) };
  }
  return null;
};

const LIST_TAG = { decimal: "ol", "upper-roman": "ol", "lower-alpha": "ol", bullet: "ul" };
const LIST_STYLE = {
  decimal: ' type="1"',
  "upper-roman": ' type="I"',
  "lower-alpha": ' type="a"',
  bullet: "",
};

// Collects blocks (paragraph / heading / list item) then renders them in one pass, so list
// runs can be wrapped in a single <ol> rather than one list per item.
class BlockBuilder {
  constructor() {
    this.blocks = [];
    this.open = null;
  }

  flush() {
    if (this.open && this.open.text.trim()) this.blocks.push(this.open);
    this.open = null;
  }

  startParagraph(text) {
    this.flush();
    this.open = { kind: "p", text };
  }

  startItem(type, text) {
    this.flush();
    this.open = { kind: "li", type, text };
  }

  append(separator, text) {
    if (!this.open) {
      this.open = { kind: "p", text };
      return;
    }
    this.open.text += separator + text;
  }

  startHeading(text) {
    this.flush();
    this.open = { kind: "h3", text };
  }

  heading(text) {
    this.flush();
    this.blocks.push({ kind: "h3", text });
  }

  // The layout marked most display headings with a leading tab, but a handful — "Methodology",
  // "കോഴ്‌സ് ഔട്ട്ലൈൻ", "സമിതിയുടെ ഘടന" — carry no marker at all. What gives them away is
  // shape and position: a short unpunctuated line sitting directly on top of a list or another
  // heading. A wrapped paragraph never looks like that, because it reflows into something long
  // that ends in a full stop.
  promoteHeadings() {
    for (let i = 0; i < this.blocks.length - 1; i += 1) {
      const block = this.blocks[i];
      const next = this.blocks[i + 1];
      if (block.kind !== "p") continue;
      if (next.kind !== "li" && next.kind !== "h3") continue;
      const text = block.text.trim();
      if (text.length > 60 || /[.?!]$/.test(text)) continue;
      block.kind = "h3";
    }
  }

  toHtml() {
    this.flush();
    this.promoteHeadings();
    const out = [];
    let openList = null;

    const closeList = () => {
      if (openList) {
        out.push(`</${LIST_TAG[openList]}>`);
        openList = null;
      }
    };

    for (const block of this.blocks) {
      if (block.kind === "li") {
        if (openList && openList !== block.type) closeList();
        if (!openList) {
          openList = block.type;
          out.push(`<${LIST_TAG[block.type]}${LIST_STYLE[block.type]}>`);
        }
        out.push(`<li>${escapeHtml(block.text.trim())}</li>`);
        continue;
      }
      closeList();
      const tag = block.kind;
      out.push(`<${tag}>${escapeHtml(block.text.trim())}</${tag}>`);
    }
    closeList();
    return out.join("\n");
  }
}

// lines: the whole file, already normalised and split.
// from/to: half-open range of line indices for this chapter's body.
// spaceBreaks: Set of line indices i where the break between line i and i+1 is a word
//   boundary. Only consulted for hard-wrapped sources.
// hardWrapped: true when the file was broken at the printed line width, so an unlisted break
//   is a split word and closes up. False for sources typed one unit per line, where every
//   break is a word boundary — running those together would produce "ചെയർമാൻമസ്ജിദ്".
const linesToHtml = (lines, from, to, spaceBreaks, hardWrapped) => {
  const builder = new BlockBuilder();
  let previousIndex = -1;
  let previousWasIndented = false;

  for (let i = from; i < to; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      builder.flush();
      previousIndex = -1;
      previousWasIndented = false;
      continue;
    }

    const bold = line.match(BOLD);
    if (bold) {
      builder.heading(bold[1].trim());
      previousIndex = -1;
      previousWasIndented = false;
      continue;
    }

    // A leading tab is how the layout marked a display heading — but the wrapped continuation
    // lines of a tab-indented sub-list are indented too. What separates them is what came
    // before: a heading interrupts un-indented text, a continuation follows its own item.
    const marker = listMarker(line);
    const indented = /^\t/.test(raw);
    if (indented && !marker && !previousWasIndented) {
      builder.startHeading(line);
      previousIndex = endsParagraph(line) ? -1 : i;
      previousWasIndented = true;
      continue;
    }

    if (marker) {
      builder.startItem(marker.type, marker.text);
      // Without this a single-line list item stays open and swallows whatever follows it —
      // which is how "മൊഡ്യൂൾ 3" ended up appended to the last bullet of module 2.
      previousIndex = endsParagraph(line) ? -1 : i;
      previousWasIndented = indented;
      continue;
    }

    if (previousIndex === -1) {
      builder.startParagraph(line);
    } else {
      const previous = lines[previousIndex].trim();
      // Word boundary when the source is not hard-wrapped, when the reviewed decisions say
      // so, or when the previous line ended on punctuation that can only follow a whole word.
      const isWordBoundary =
        !hardWrapped || spaceBreaks.has(previousIndex) || endsWithSoftPunctuation(previous);
      builder.append(isWordBoundary ? " " : "", line);
    }

    previousWasIndented = indented;
    if (endsParagraph(line)) {
      builder.flush();
      previousIndex = -1;
    } else {
      previousIndex = i;
    }
  }

  return builder.toHtml();
};

// chapterDefs: [{ title, slug, markers: [exact line text, …] }] in document order. `markers`
// are the consecutive lines that make up the printed chapter title; the body runs from just
// after them to the first marker of the next chapter.
const parseBook = ({ text, chapterDefs, spaceBreaks = new Set(), hardWrapped = true }) => {
  const lines = normaliseText(text).split("\n");
  const trimmed = lines.map((l) => l.trim());

  // Searched in document order rather than globally, because a heading can legitimately
  // repeat — the second book uses "വിദ്യാഭ്യാസ സമിതി" both as a section and as the title of
  // അനുബന്ധം 1. Scanning forward from the previous chapter picks the right one and doubles
  // as the ordering check.
  const starts = [];
  let cursor = 0;
  for (const def of chapterDefs) {
    const first = def.markers[0];
    const index = trimmed.indexOf(first, cursor);
    if (index === -1) {
      throw new Error(`Chapter marker not found at or after line ${cursor}: ${first}`);
    }
    starts.push(index);
    cursor = index + def.markers.length;
  }

  return chapterDefs.map((def, n) => {
    const bodyFrom = starts[n] + def.markers.length;
    const bodyTo = n + 1 < starts.length ? starts[n + 1] : lines.length;
    return {
      id: n + 1,
      slug: def.slug,
      title: def.title,
      order: n,
      bodyHtml: linesToHtml(lines, bodyFrom, bodyTo, spaceBreaks, hardWrapped),
    };
  });
};

module.exports = { normaliseText, parseBook, linesToHtml, listMarker, endsParagraph };
