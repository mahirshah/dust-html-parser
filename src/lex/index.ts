import {
  createToken,
  IMultiModeLexerDefinition,
  Lexer,
  TokenType,
} from 'chevrotain';
import { matchTag } from '../utils/dustHelpers';

// todo: implement html comments
enum MODE {
  TAG_OPEN_STATE = 'TAG_OPEN_STATE',
  ATTRIBUTE_NAME_STATE = 'ATTRIBUTE_NAME_STATE',
  DATA = 'DATA',
  DUST = 'DUST',
  DUST_QUOTE = 'DUST_QUOTE',
}
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
  push_mode: MODE.DUST,
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
const dustElse = createToken({ name: 'dustElse', pattern: /{:else}/ });
const startDustQuotedParam = createToken({
  name: 'startDustQuotedParam',
  pattern: /="/,
  push_mode: MODE.DUST_QUOTE,
});
const endDustQuote = createToken({
  name: 'endDustQuote',
  pattern: /"/,
  pop_mode: true,
});
const lb = createToken({ name: 'lb', pattern: /\[/ });
const rb = createToken({ name: 'rb', pattern: /]/ });
const bar = createToken({ name: 'bar', pattern: /\|/ });
const hash = createToken({ name: 'hash', pattern: /#/ });
const carat = createToken({ name: 'carat', pattern: /\^/ });
const escapedQuote = createToken({ name: 'escapedQuote', pattern: /\\\\"/ });
const quotedKey = createToken({ name: 'quotedKey', pattern: /"[^"]*"/ });
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
const char = createToken({ name: 'char', pattern: /\s|\S/ });

// html tokens
const htmlStartTag = createToken({
  name: 'htmlStartTag',
  pattern: /<[a-zA-Z][^\s/>]+/,
  push_mode: MODE.TAG_OPEN_STATE,
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
  name: 'htmlSelfClosingTagEnd',
  pattern: /\/>/,
  pop_mode: true,
});
const attributeName = createToken({
  name: 'attributeName',
  pattern: /[^\s=/>"']+/,
});
const attributeValue = createToken({
  name: 'attributeValue',
  pattern: /[^"'<=`\s>]+|(?:"[^"]*")|(?:'[^']*')/,
  pop_mode: true,
});
const attributeEquals = createToken({
  name: 'attributeEquals',
  pattern: /\s*=\s*/,
  push_mode: MODE.ATTRIBUTE_NAME_STATE,
});
const attributeWhiteSpace = createToken({
  name: 'attributeWhiteSpace',
  pattern: /\s/,
  pop_mode: true,
});
const buffer = createToken({
  name: 'buffer',
  pattern: /[^{<]+/,
});
const dustQuoteBuffer = createToken({
  name: 'dustQuoteBuffer',
  pattern: /[^{\\"]+/,
});

export const lexerDefinition: IMultiModeLexerDefinition = {
  modes: {
    [MODE.DATA]: [
      comment,
      raw,
      dustElse,
      closingDustTag,
      dustStart,
      htmlStartTag,
      closingHtmlTag,
      buffer,
      char,
    ],
    [MODE.DUST]: [
      WhiteSpace,
      comment,
      raw,
      dustStart,
      selfClosingDustTagEnd,
      closingDustTagEnd,
      startDustQuotedParam,
      quotedKey,
      lb,
      rb,
      bar,
      hash,
      carat,
      escapedQuote,
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
      float,
      unsignedInteger,
      signedInteger,
      dot,
      char,
    ],
    // inside dust params we can have literals, references, or specials
    [MODE.DUST_QUOTE]: [dustStart, escapedQuote, endDustQuote, dustQuoteBuffer],
    [MODE.TAG_OPEN_STATE]: [
      WhiteSpace,
      comment,
      raw,
      dustStart,
      htmlSelfClosingTagEnd,
      htmlTagEnd,
      attributeName,
      attributeEquals,
    ],
    [MODE.ATTRIBUTE_NAME_STATE]: [attributeValue, attributeWhiteSpace],
  },
  defaultMode: MODE.DATA,
};
export const DustLexer = new Lexer(lexerDefinition);
export const tokenVocabulary = Array()
  .concat(...Object.values(lexerDefinition.modes))
  .reduce<{ [key: string]: TokenType }>(
    (vocab, token: TokenType) => ({
      [token.name]: token,
      ...vocab,
    }),
    {},
  );
export function lex(inputText: string) {
  const lexingResult = DustLexer.tokenize(inputText);

  if (lexingResult.errors.length > 0) {
    throw Error(`Error lexing input text: ${lexingResult.errors[0].message}`);
  }

  return lexingResult;
}
