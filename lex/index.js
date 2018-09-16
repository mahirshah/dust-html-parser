const { createToken, Lexer } = require('chevrotain');
const { matchTag } = require('./dustHelpers');

const MODES = {
  TAG_OPEN_STATE: 'TAG_OPEN_STATE',
  ATTRIBUTE_NAME_STATE: 'ATTRIBUTE_NAME_STATE',
  DATA: 'DATA',
  DUST: 'DUST',
};
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
const comment = createToken({
  name: 'comment',
  pattern: /{!(?:[^!]|!(?!}))*!}/,
});
const raw = createToken({ name: 'raw', pattern: /{`(?:[^`]|`(?!}))*!}/ });
const dustStart = createToken({
  name: 'dustStart',
  pattern: matchTag,
  push_mode: MODES.DUST,
  line_breaks: false,
});
const selfClosingDustTagEnd = createToken({
  name: 'selfClosingDustTagEnd',
  pattern: /\/}/,
  pop_mode: true,
});
const closingDustTagEnd = createToken({
  name: 'closingDustTagEnd',
  pattern: /}/,
  pop_mode: true,
});
const closingDustTag = createToken({
  name: 'closingDustTag',
  pattern: /{\/[^}]+}/,
});
const lb = createToken({ name: 'lb', pattern: /\[/ });
const rb = createToken({ name: 'rb', pattern: /]/ });
const bar = createToken({ name: 'bar', pattern: /\|/ });
const hash = createToken({ name: 'hash', pattern: /#/ });
const carat = createToken({ name: 'carat', pattern: /\^/ });
const escapedQuote = createToken({ name: 'escapedQuote', pattern: /\\\\"/ });
const quote = createToken({ name: 'quote', pattern: /"/ });
const questionMark = createToken({ name: 'questionMark', pattern: /\?/ });
const gt = createToken({ name: 'gt', pattern: />/ });
const lt = createToken({ name: 'lt', pattern: /</ });
const plus = createToken({ name: 'plus', pattern: /\+/ });
const equals = createToken({ name: 'equals', pattern: /=/ });
const percent = createToken({ name: 'percent', pattern: /%/ });
const colon = createToken({ name: 'colon', pattern: /:/ });
const at = createToken({ name: 'at', pattern: /@/ });
const tilde = createToken({ name: 'tilde', pattern: /~/ });
const key = createToken({ name: 'key', pattern: /[a-zA-Z_$][0-9a-zA-Z_$-]*/ });
const dot = createToken({ name: 'dot', pattern: /\./ });
const unsignedInteger = createToken({
  name: 'unsignedInteger',
  pattern: /[0-9]+/,
});
const float = createToken({
  name: 'float',
  pattern: /-?[0-9]+\.[0-9]+/,
});
const signedInteger = createToken({
  name: 'signedInteger',
  pattern: /-[0-9]+/,
});
const char = createToken({ name: 'char', pattern: /[\s\S]/ });

// html tokens
const startTag = createToken({
  name: 'startTag',
  pattern: /<[a-zA-Z][^\s/>]+/,
  push_mode: MODES.TAG_OPEN_STATE,
});
const closingHtmlTag = createToken({
  name: 'closingHtmlTag',
  pattern: /<\/[^>]+>/,
});
const htmlTagEnd = createToken({
  name: 'htmlTagEnd',
  pattern: />/,
  pop_mode: true,
});
const htmlSelfClosingTagEnd = createToken({
  name: 'htmlTagEnd',
  pattern: /\/>/,
  pop_mode: true,
});
const attributeName = createToken({
  name: 'attributeName',
  pattern: /[^\s=/>"']+/,
  push_mode: MODES.ATTRIBUTE_NAME_STATE,
});
const attributeValue = createToken({
  name: 'attributeValue',
  pattern: /[^"'<=`\s>]+|(?:"[^"]*")|(?:'[^']*')/,
  pop_mode: true,
});
const attributeEquals = createToken({
  name: 'attributeEquals',
  pattern: /\s*=\s*/,
});
const attributeWhiteSpace = createToken({
  name: 'attributeWhiteSpace',
  pattern: /\s/,
  pop_mode: true,
});

const lexerDefinition = {
  modes: {
    [MODES.DATA]: [
      comment,
      raw,
      dustStart,
      startTag,
      closingDustTag,
      closingHtmlTag,
      char,
    ],
    [MODES.DUST]: [
      comment,
      raw,
      dustStart,
      selfClosingDustTagEnd,
      closingDustTagEnd,
      lb,
      rb,
      bar,
      hash,
      carat,
      escapedQuote,
      quote,
      questionMark,
      gt,
      lt,
      plus,
      equals,
      percent,
      colon,
      at,
      tilde,
      key,
      dot,
      unsignedInteger,
      float,
      signedInteger,
      char,
    ],
    [MODES.TAG_OPEN_STATE]: [
      WhiteSpace,
      comment,
      raw,
      dustStart,
      htmlSelfClosingTagEnd,
      htmlTagEnd,
      attributeName,
    ],
    [MODES.ATTRIBUTE_NAME_STATE]: [
      attributeEquals,
      attributeValue,
      attributeWhiteSpace,
    ],
  },
  defaultMode: MODES.DATA,
};

const SelectLexer = new Lexer(lexerDefinition);

module.exports = {
  tokenVocabulary: [].concat(...Object.values(lexerDefinition.modes)).reduce(
    (vocab, token) => ({
      [token.name]: token,
      ...vocab,
    }),
    {}
  ),

  lex(inputText) {
    const lexingResult = SelectLexer.tokenize(inputText);

    if (lexingResult.errors.length > 0) {
      throw Error('Error lexing input text', lexingResult.errors);
    }

    return lexingResult;
  },
};
