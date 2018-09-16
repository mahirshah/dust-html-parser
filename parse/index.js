const { Parser } = require('chevrotain');
const { tokenVocabulary, lex } = require('../lex');

const {
  ld,
  rd,
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
  comment,
  key,
  dot,
  unsignedInteger,
  float,
  signedInteger,
  text,
} = tokenVocabulary;

class DustParser extends Parser {
  constructor(input) {
    super(input, tokenVocabulary);
    const $ = this;

    // {path|filter|filter2}
    $.RULE('reference', () => {
      $.CONSUME(ld);
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
