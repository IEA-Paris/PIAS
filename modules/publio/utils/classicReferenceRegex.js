const referenceRegex =
  /(\([^)]*,\s*\d\d\d\d(\)|(;[^)])*)\))|(\([^)]*,\s*\d\d\d\d(\)|(;[^)]*))$)|(^[^()]*,\s*\d\d\d\d(\)|(;[^)])*)\))|(^\s*\d\d\d\d\))/i
export default referenceRegex
