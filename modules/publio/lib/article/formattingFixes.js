/* eslint-disable no-misleading-character-class, no-control-regex, unicorn/escape-case */
// The patterns below intentionally target invisible / zero-width / control
// characters and use lowercase \u escapes; the rules above would flag those by
// design, so they are disabled for this file.
// Normalise characters that break Nuxt content markdown parsing or paged.js PDF
// rendering. These mostly arrive via copy-paste from Word, PDFs and web pages:
// invisible/zero-width characters and exotic whitespace that survive the round
// trip but confuse Markdown tokenisation and line breaking.
//
// Patterns use \u escapes (not literal glyphs) so there are no invisible
// characters in this source file, which keeps it readable and safe from editors
// or formatters silently stripping a character out of a pattern.

const CHARACTER_FIXES = [
  // Non-breaking & exotic spaces -> regular space.
  // U+00A0 NBSP, U+1680, U+2000-U+200A, U+202F, U+205F, U+3000 ideographic space.
  [/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' '],

  // Line & paragraph separators -> newline. U+2028 LS, U+2029 PS.
  [/[\u2028\u2029]/g, '\n'],

  // Zero-width & invisible formatting characters -> removed.
  // U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ, U+2060 word joiner, U+FEFF BOM/ZWNBSP.
  [/[\u200b\u200c\u200d\u2060\ufeff]/g, ''],

  // Bidirectional / directional formatting marks -> removed.
  // U+200E LRM, U+200F RLM, U+202A-U+202E embeddings, U+2066-U+2069 isolates.
  [/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, ''],

  // Soft hyphen (invisible, breaks word matching) -> removed. U+00AD.
  [/\u00ad/g, ''],

  // Curly double quotes -> straight. U+201C U+201D U+201E U+201F.
  [/[\u201c\u201d\u201e\u201f]/g, '"'],

  // Curly single quotes / apostrophes -> straight. U+2018 U+2019 U+201A U+201B.
  [/[\u2018\u2019\u201a\u201b]/g, "'"],

  // Hyphen-like dashes (non-spacing) -> hyphen-minus.
  // U+2010 hyphen, U+2011 non-breaking hyphen, U+2012 figure dash.
  [/[\u2010\u2011\u2012]/g, '-'],

  // Horizontal ellipsis -> three dots. U+2026.
  [/\u2026/g, '...'],

  // Replacement / object-replacement chars left by broken encodings -> removed.
  // U+FFFC object replacement, U+FFFD replacement character.
  [/[\ufffc\ufffd]/g, ''],
]

export default (text) => {
  let result = text

  // Strip / normalise characters that hinder markdown rendering and pdf generation.
  for (const [pattern, replacement] of CHARACTER_FIXES) {
    result = result.replace(pattern, replacement)
  }

  // fix footnotes
  const footnoteRegex = /\\\[\^(\d|\d\d|\d\d\d)\\\]/gi
  result = result.replace(footnoteRegex, '[^$1]')

  return result
}
