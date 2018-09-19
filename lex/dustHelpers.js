const R_KEY = /[a-zA-Z_$][0-9a-zA-Z_$-]*/g;
const R_INT = /[0-9]+/g;
const KEY_TOKEN = 'K';
const INT_TOKEN = 'I';
const R_ACCEPTED_CHARS = /^{[\][0-9a-zA-Z_$\-.|]+}$/;
const R_NON_REF_TAG = /^{\s*[#?^><+%:@/~]\s*[^}]+}$/;

function isReference(string) {
  // first make sure the starting char is "{"
  if (string[0] !== '{') {
    return false;
  }
  // make sure it has a closing brace and does not immediately follow the
  // opening brace
  const indexOfRightBrace = string.indexOf('}');
  if (indexOfRightBrace === -1 || indexOfRightBrace === 1) {
    return false;
  }

  const substring = string.substring(0, indexOfRightBrace + 1);
  let bracketCount = 0;

  // ensure no non-valid chars inside reference
  if (!R_ACCEPTED_CHARS.test(substring)) {
    return false;
  }

  const tokenizedSubstring = substring
    .replace(R_KEY, KEY_TOKEN)
    .replace(R_INT, INT_TOKEN);

  for (let i = 0; i < tokenizedSubstring.length; i += 1) {
    const char = tokenizedSubstring[i];
    const prevChar = tokenizedSubstring[i - 1];
    const nextChar = tokenizedSubstring[i + 1];

    if (char === '[') {
      if (nextChar === '[' || nextChar === ']') {
        return false;
      }
      bracketCount += 1;
    } else if (char === ']') {
      if (bracketCount === 0) {
        return false;
      }

      bracketCount -= 1;
    } else if (char === '.') {
      if (prevChar === '{' && nextChar === '}') {
        return true;
      } else if (prevChar === '.' && nextChar !== KEY_TOKEN) {
        return false;
      } else if (nextChar === '}') {
        return false;
      } else if (nextChar === ']' && prevChar !== '[') {
        return false;
      }
    } else if (char === KEY_TOKEN) {
      if (prevChar === ']') {
        return false;
      }
    } else if (char === INT_TOKEN) {
      if (prevChar !== '[' || nextChar !== ']') {
        return false;
      }
    } else if (char === '|') {
      if(prevChar === '{') {
        return false;
      }

      return tokenizedSubstring
        .slice(i + 1, -1)
        .split('|')
        .every(token => token === KEY_TOKEN);
    }
  }

  return !bracketCount;
}

// ld ws* [#?^><+%:@/~%] ws* (!rd !eol .)+ ws* rd
function isNonReferenceTag(tagString) {
  return R_NON_REF_TAG.test(tagString);
}

/**
 * Tag is defined as matching an opening brace plus any of #?^><+%:@/~% plus
 * 0 or more whitespaces plus any character or characters that doesn't match
 * rd or eol plus 0 or more whitespaces plus a closing brace
 * tag
 *   = ld ws* [#?^><+%:@/~%] ws* (!rd !eol .)+ ws* rd
 *   / reference
 *
 * @see {@link http://sap.github.io/chevrotain/docs/guide/custom_token_patterns.html#usage}
 *   for more info on custom token patterns
 *
 * @param {string} text - the entire string to be tokenized
 * @param {number} startOffset - the start offset in the string
 * @return {null|string[]} - null if no match, or ['{'] if match
 */
function matchTag(text, startOffset) {
  if (text[startOffset] !== '{') {
    return null;
  }

  const closingBraceIndex = text.slice(startOffset).indexOf('}') + startOffset;

  if (closingBraceIndex === -1) {
    return null;
  }

  const tagSubstring = text.substring(startOffset, closingBraceIndex + 1);

  return isNonReferenceTag(tagSubstring) || isReference(tagSubstring)
    ? ['{']
    : null;
}

module.exports = {
  isReference,
  matchTag,
};
