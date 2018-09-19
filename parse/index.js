const { Parser } = require('chevrotain');
const { tokenVocabulary, lex, DustLexer, lexerDefinition } = require('../lex');

const {
  comment,
  raw,
  dustElse,
  dustStart,
  startTag,
  closingDustTag,
  closingHtmlTag,
  buffer,
  char,
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
  dot,
  unsignedInteger,
  float,
  signedInteger,
  endDustQuote,
  dustQuoteBuffer,
  htmlSelfClosingTagEnd,
  htmlTagEnd,
  attributeName,
  attributeEquals,
  attributeValue,
  attributeWhiteSpace,
} = tokenVocabulary;

class DustParser extends Parser {
  constructor(input) {
    super(input, lexerDefinition);
    const $ = this;

    $.RULE('body', () => {
      $.MANY(() => {
        $.SUBRULE($.part);
      });
    });

    $.RULE('part', () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.rawRule);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.commentRule);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.section);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.special);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.reference);
          },
        },
        {
          ALT: () => {
            $.OR1([
              {
                ALT: () => {
                  $.CONSUME(buffer);
                },
              },
              {
                ALT: () => {
                  $.CONSUME(char);
                },
              },
            ]);
          },
        },
      ]);
    });

    $.RULE('section', () => {
      $.CONSUME(dustStart);
      $.OR([
        {
          ALT: () => {
            $.CONSUME(hash);
          },
        },
        {
          ALT: () => {
            $.CONSUME(questionMark);
          },
        },
        {
          ALT: () => {
            $.CONSUME(carat);
          },
        },
        {
          ALT: () => {
            $.CONSUME(lt);
          },
        },
        {
          ALT: () => {
            $.CONSUME(plus);
          },
        },
        {
          ALT: () => {
            $.CONSUME(at);
          },
        },
        {
          ALT: () => {
            $.CONSUME(percent);
          },
        },
      ]);
      $.SUBRULE($.identifier);
      $.SUBRULE($.context);
      $.SUBRULE($.params);
      $.OR1([
        {
          ALT: () => {
            $.CONSUME(selfClosingDustTagEnd);
          },
        },
        {
          ALT: () => {
            $.CONSUME(closingDustTagEnd);
            $.SUBRULE($.body);
            $.OPTION(() => {
              $.CONSUME(dustElse);
              $.SUBRULE2($.body);
            });
            $.CONSUME(closingDustTag);
          },
        },
      ]);
    });

    $.RULE('context', () => {
      $.OPTION(() => {
        $.CONSUME(colon);
        $.SUBRULE($.identifier);
      });
    });

    $.RULE('params', () => {
      $.MANY(() => {
        $.CONSUME(key);
        $.OR([
          {
            ALT: () => {
              $.CONSUME(equals);
              $.OR1([
                {
                  ALT: () => {
                    $.SUBRULE($.number);
                  },
                },
                {
                  ALT: () => {
                    $.SUBRULE($.identifier);
                  },
                },
              ]);
            },
          },
          {
            ALT: () => {
              $.CONSUME(startDustQuotedParam);
              $.SUBRULE($.inlineWithoutStartQuote);
            },
          },
        ]);
      });
    });

    // {identifier|filter|filter2}
    $.RULE('reference', () => {
      $.CONSUME(dustStart);
      $.SUBRULE($.identifier);
      $.SUBRULE($.filters);
      $.CONSUME(closingDustTagEnd);
    });

    // |filter1|filter2
    $.RULE('filters', () => {
      $.MANY(() => {
        $.CONSUME(bar);
        $.CONSUME(key);
      });
    });

    // {~key}
    $.RULE('special', () => {
      $.CONSUME(dustStart);
      $.CONSUME(tilde);
      $.CONSUME(key);
      $.CONSUME(closingDustTagEnd);
    });

    // a path or key
    $.RULE('identifier', () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.path);
          },
        },
        {
          ALT: () => {
            $.CONSUME(key);
          },
        },
      ]);
    });

    // 5 or -5 or 5.5 or -5.5
    $.RULE('number', () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(unsignedInteger);
          },
        },
        {
          ALT: () => {
            $.CONSUME(signedInteger);
          },
        },
        {
          ALT: () => {
            $.CONSUME(float);
          },
        },
      ]);
    });

    // key.key2
    $.RULE('path', () => {
      $.OR([
        {
          ALT: () => {
            $.OPTION(() => {
              $.CONSUME(key);
            });
            $.AT_LEAST_ONE(() => {
              $.OR1([
                {
                  ALT: () => {
                    $.SUBRULE($.arrayPart);
                  },
                },
                {
                  ALT: () => {
                    $.SUBRULE($.array);
                  },
                },
              ]);
            });
          },
        },
        {
          ALT: () => {
            $.CONSUME(dot);
            $.MANY(() => {
              $.OR2([
                {
                  ALT: () => {
                    $.SUBRULE1($.arrayPart);
                  },
                },
                {
                  ALT: () => {
                    $.SUBRULE1($.array);
                  },
                },
              ]);
            });
          },
        },
      ]);
    });

    $.RULE('array', () => {
      $.CONSUME(lb);
      $.OR([
        {
          ALT: () => {
            $.CONSUME(unsignedInteger);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.identifier);
          },
        },
      ]);
      $.CONSUME(rb);
      $.OPTION(() => {
        $.SUBRULE($.arrayPart);
      });
    });

    $.RULE('arrayPart', () => {
      $.AT_LEAST_ONE(() => {
        $.CONSUME(dot);
        $.CONSUME(key);
      });
      $.OPTION(() => {
        $.SUBRULE($.array);
      });
    });

    $.RULE('inlineWithoutStartQuote', () => {
      $.MANY(() => {
        $.OR([
          {
            ALT: () => {
              $.SUBRULE($.special);
            },
          },
          {
            ALT: () => {
              $.SUBRULE($.reference);
            },
          },
          {
            ALT: () => {
              $.CONSUME(escapedQuote);
            },
          },
          {
            ALT: () => {
              $.CONSUME(dustQuoteBuffer);
            },
          },
        ]);
      });
      $.CONSUME(endDustQuote);
    });

    // {` raw `}
    $.RULE('rawRule', () => {
      $.CONSUME(raw);
    });

    // {! comment !}
    $.RULE('commentRule', () => {
      $.CONSUME(comment);
    });

    this.performSelfAnalysis();
  }
}

const parserInstance = new DustParser([]);

module.exports = {
  parserInstance,
  DustParser,
  parse(inputText) {
    const lexResult = DustLexer.tokenize(inputText);
    parserInstance.input = lexResult.tokens;
    parserInstance.body();

    if(parserInstance.errors.length > 0) {
      throw new Error(`Error parsing input: ${parserInstance.errors[0].message}`);
    }

    return parserInstance;
  },
};
