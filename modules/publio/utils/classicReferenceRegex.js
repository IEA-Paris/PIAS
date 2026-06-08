// Matches a *textual* in-text reference — "(Author, YYYY)", grouped variants
// "(A, YYYY; B, ZZZZ)", and unclosed/leading fragments. The year may carry a
// lowercase disambiguation suffix ("1963a", "1963b"): the `[a-z]?` after each
// `\d\d\d\d` is what lets a closed "(Goffman, 1963a)" match HERE as a complete
// reference instead of falling through to the supplementary pass, which would
// only capture "(Goffman, 1963" and leave the orphan "a)" behind on rewrite.
const referenceRegex =
  /(\([^)]*,\s*\d\d\d\d[a-z]?(\)|(;[^)])*)\))|(\([^)]*,\s*\d\d\d\d[a-z]?(\)|(;[^)]*))$)|(^[^()]*,\s*\d\d\d\d[a-z]?(\)|(;[^)])*)\))|(^\s*\d\d\d\d[a-z]?\))/i
export default referenceRegex
