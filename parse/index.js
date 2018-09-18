const { Parser } = require('chevrotain');
const { tokenVocabulary, lex } = require('../lex');

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
  WhiteSpace,
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
  rd,
  ld,
  endDustQuote,
  htmlSelfClosingTagEnd,
  htmlTagEnd,
  attributeName,
  attributeEquals,
  attributeValue,
  attributeWhiteSpace,
} = tokenVocabulary;

class DustParser extends Parser {
  constructor(input) {
    super(input, tokenVocabulary);
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
            $.SUBRULE($.raw);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.comment);
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.section);
          },
        },
        // todo: add other parts here
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
      $.OR([
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
      $.CONSUME(colon);
      $.SUBRULE($.identifier);
    });

    $.RULE('params', () => {
      $.MANY(() => {
        $.CONSUME(key);
        $.OR([
          {
            ALT: () => {
              $.CONSUME(equals);
              $.OR([
                {
                  ALT: () => {
                    // todo: implement number
                    $.SUBRULE($.number);
                  },
                },
                {
                  ALT: () => {
                    $.SUBRULE($.identifier);
                  },
                }
              ]);
            },
          },
          {
            ALT: () => {
              $.CONSUME(startDustQuotedParam);
              // todo: implement inline without start quote
              $.SUBRULE($.inlineWithoutStartQuote);
            },
          }
        ]);
      });
    });

    // {path|filter|filter2}
    $.RULE('reference', () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(dustStart);
          },
        },
        {
          ALT: () => {
            $.CONSUME(lb);
          },
        },
      ]);
      $.SUBRULE($.path);
      $.OPTION(() => {
        $.CONSUME(bar);
        $.MANY_SEP({
          SEP: bar,
          DEF: () => {
            $.CONSUME(key);
          },
        });
      });
      $.CONSUME(rd);
    });

    // {! comment !}
    $.RULE('comment', () => {
      $.CONSUME(comment);
    });

    // {` raw `}
    $.RULE('raw', () => {
      $.CONSUME(raw);
    });

    $.RULE('tagstart', () => {
      $.CONSUME(ld);
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
      $.SUBRULE($.path);
      $.OPTION(() => {
        $.CONSUME(colon);
        $.SUBRULE($.path);
      });
      $.SUBRULE($.params);
    });

    $.RULE('param', () => {
      $.CONSUME(key);
      $.CONSUME(equals);
      $.OR([
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
        {
          ALT: () => {
            $.SUBRULE($.inline);
          },
        },
      ]);
    });

    $.RULE('inline', () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(quote);
            $.CONSUME(quote);
          },
        },
        {
          ALT: () => {
            $.CONSUME(quote);
            $.CONSUME(quote);
          },
        },
        {
          ALT: () => {
            $.CONSUME(quote);
            $.CONSUME(quote);
          },
        },
      ]);
    });

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
              $.OR([
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
              $.OR([
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

    this.performSelfAnalysis();
  }
}

const parserInstance = new DustParser([]);

module.exports = {
  parserInstance,
  DustParser,
  parse(inputText) {
    const lexResult = lex(inputText);
    parserInstance.input = lexResult.tokens;
  },
};
