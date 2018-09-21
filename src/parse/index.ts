import { IToken, Parser } from 'chevrotain';
import { DustLexer, lexerDefinition, tokenVocabulary } from '../lex';

const {
  comment,
  raw,
  dustElse,
  dustStart,
  htmlStartTag,
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
} = tokenVocabulary;

export class DustParser extends Parser {

  public body = this.RULE('body', () => {
    this.MANY(() => {
      this.SUBRULE(this.part);
    });
  });

  private part = this.RULE('part', () => {
    this.OR([
      {
        ALT: () => {
          this.SUBRULE(this.rawRule);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.commentRule);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.section);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.special);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.reference);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.htmlTag);
        },
      },
      {
        ALT: () => {
          this.OR1([
            {
              ALT: () => {
                this.CONSUME(buffer);
              },
            },
            {
              ALT: () => {
                this.CONSUME(char);
              },
            },
          ]);
        },
      },
    ]);
  });

  private section = this.RULE('section', () => {
    this.CONSUME(dustStart);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(hash);
        },
      },
      {
        ALT: () => {
          this.CONSUME(questionMark);
        },
      },
      {
        ALT: () => {
          this.CONSUME(carat);
        },
      },
      {
        ALT: () => {
          this.CONSUME(lt);
        },
      },
      {
        ALT: () => {
          this.CONSUME(plus);
        },
      },
      {
        ALT: () => {
          this.CONSUME(at);
        },
      },
      {
        ALT: () => {
          this.CONSUME(percent);
        },
      },
    ]);
    this.SUBRULE(this.identifier);
    this.SUBRULE(this.context);
    this.SUBRULE(this.params);
    this.OR1([
      {
        ALT: () => {
          this.CONSUME(selfClosingDustTagEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME(closingDustTagEnd);
          this.SUBRULE(this.body);
          this.OPTION(() => {
            this.CONSUME(dustElse);
            this.SUBRULE2(this.body);
          });
          this.CONSUME(closingDustTag);
        },
      },
    ]);
  });

  private context = this.RULE('context', () => {
    this.OPTION(() => {
      this.CONSUME(colon);
      this.SUBRULE(this.identifier);
    });
  });

  private params = this.RULE('params', () => {
    this.MANY(() => {
      this.CONSUME(key);
      this.OR([
        {
          ALT: () => {
            this.CONSUME(equals);
            this.OR1([
              {
                ALT: () => {
                  this.SUBRULE(this.number);
                },
              },
              {
                ALT: () => {
                  this.SUBRULE(this.identifier);
                },
              },
            ]);
          },
        },
        {
          ALT: () => {
            this.CONSUME(startDustQuotedParam);
            this.SUBRULE(this.inlineWithoutStartQuote);
          },
        },
      ]);
    });
  });

  // {identifier|filter|filter2}
  private reference = this.RULE('reference', () => {
    this.CONSUME(dustStart);
    this.SUBRULE(this.identifier);
    this.SUBRULE(this.filters);
    this.CONSUME(closingDustTagEnd);
  });

  private partial = this.RULE('partial', () => {
    this.CONSUME(dustStart);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(gt);
        },
      },
      {
        ALT: () => {
          this.CONSUME(plus);
        },
      },
    ]);
    this.OR1([
      {
        ALT: () => {
          this.CONSUME(key);
        },
      },
      {
        ALT: () => {
          this.CONSUME(quotedKey);
        },
      },
    ]);
    this.SUBRULE(this.context);
    this.SUBRULE(this.params);
    this.CONSUME(selfClosingDustTagEnd);
  });

  // |filter1|filter2
  private filters = this.RULE('filters', () => {
    this.MANY(() => {
      this.CONSUME(bar);
      this.CONSUME(key);
    });
  });

  // {~key}
  private special = this.RULE('special', () => {
    this.CONSUME(dustStart);
    this.CONSUME(tilde);
    this.CONSUME(key);
    this.CONSUME(closingDustTagEnd);
  });

  // a path or key
  private identifier = this.RULE('identifier', () => {
    this.OR([
      {
        ALT: () => {
          this.SUBRULE(this.path);
        },
      },
      {
        ALT: () => {
          this.CONSUME(key);
        },
      },
    ]);
  });

  // 5 or -5 or 5.5 or -5.5
  private number = this.RULE('number', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(unsignedInteger);
        },
      },
      {
        ALT: () => {
          this.CONSUME(signedInteger);
        },
      },
      {
        ALT: () => {
          this.CONSUME(float);
        },
      },
    ]);
  });

  // key.key2
  private path = this.RULE('path', () => {
    this.OR([
      {
        ALT: () => {
          this.OPTION(() => {
            this.CONSUME(key);
          });
          this.AT_LEAST_ONE(() => {
            this.OR1([
              {
                ALT: () => {
                  this.SUBRULE(this.arrayPart);
                },
              },
              {
                ALT: () => {
                  this.SUBRULE(this.array);
                },
              },
            ]);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(dot);
          this.MANY(() => {
            this.OR2([
              {
                ALT: () => {
                  this.SUBRULE1(this.arrayPart);
                },
              },
              {
                ALT: () => {
                  this.SUBRULE1(this.array);
                },
              },
            ]);
          });
        },
      },
    ]);
  });

  private array = this.RULE('array', () => {
    this.CONSUME(lb);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(unsignedInteger);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.identifier);
        },
      },
    ]);
    this.CONSUME(rb);
    this.OPTION(() => {
      this.SUBRULE(this.arrayPart);
    });
  });

  private arrayPart = this.RULE('arrayPart', () => {
    this.AT_LEAST_ONE(() => {
      this.CONSUME(dot);
      this.CONSUME(key);
    });
    this.OPTION(() => {
      this.SUBRULE(this.array);
    });
  });

  private inlineWithoutStartQuote = this.RULE('inlineWithoutStartQuote', () => {
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.SUBRULE(this.special);
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.reference);
          },
        },
        {
          ALT: () => {
            this.CONSUME(escapedQuote);
          },
        },
        {
          ALT: () => {
            this.CONSUME(dustQuoteBuffer);
          },
        },
      ]);
    });
    this.CONSUME(endDustQuote);
  });

  // {` raw `}
  private rawRule = this.RULE('rawRule', () => {
    this.CONSUME(raw);
  });

  // {! comment !}
  private commentRule = this.RULE('commentRule', () => {
    this.CONSUME(comment);
  });

  private htmlTag = this.RULE('htmlTag', () => {
    this.CONSUME(htmlStartTag);
    this.SUBRULE(this.attributes);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(htmlSelfClosingTagEnd);
        },
      },
      {
        ALT: () => {
          this.CONSUME(htmlTagEnd);
          this.SUBRULE(this.body);
          this.CONSUME(closingHtmlTag);
        },
      },
    ]);
  });

  private attributes = this.RULE('attributes', () => {
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(attributeName);
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.reference);
          },
        },
      ]);
      this.OPTION(() => {
        this.CONSUME(attributeEquals);
        this.OR1([
          {
            ALT: () => {
              this.CONSUME(attributeValue);
            },
          },
          {
            ALT: () => {
              this.SUBRULE1(this.reference);
            },
          },
        ]);
      });
    });
  });
  constructor(input: IToken[]) {
    super(input, lexerDefinition);
    this.performSelfAnalysis();
  }
}
export const parserInstance = new DustParser([]);
export function parse(inputText: string) {
  const lexResult = DustLexer.tokenize(inputText);
  parserInstance.input = lexResult.tokens;
  parserInstance.body();

  if (parserInstance.errors.length > 0) {
    throw new Error(`Error parsing input: ${parserInstance.errors[0].message}`);
  }

  return parserInstance;
}
