// Matches a citation key of the form `@key`, where `key` is a BibTeX/citation-js
// entry key. Keys are alphanumeric plus `_`, `-`, and accented letters, but must
// NOT contain citation delimiters (space, `,`, `;`, `.`, `:`, `(`, `)`, `'`, `*`, `]`)
// — those terminate the match so adjacent citations and sentence punctuation are
// not swallowed. We deliberately do NOT require a `_word_YYYY` suffix: keys like
// `@aiConBook`, `@aksnes_criteria` or `@AIMagLiteracy` are valid. Validity is
// enforced downstream by looking the matched key up in the parsed bibliography
// (case-insensitively).
const referenceRegex = new RegExp(
  // eslint-disable-next-line no-misleading-character-class
  /@[\w\-àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹßÇŒÆČŠŽ陳大文都道府県Федерации]+/,
  'i'
)
export default referenceRegex
