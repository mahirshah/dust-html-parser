const { expect } = require('chai');
const { lex, tokenVocabulary } = require('./index');

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
  dustQuoteBuffer,
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

describe('Test Lexer', () => {
  it('can lex simple input', () => {
    const inputText = '{@component}Text{/  component  }';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex comments', () => {
    const inputText = '{! hello!\n\n hello! !}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
    expect(lexResult.tokens).to.have.lengthOf(1);
    expect(lexResult.tokens[0].tokenType).to.equal(comment);
  });

  it('can lex a reference with filters', () => {
    const inputText = '{reference|filter1|filter2}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;

    const tokens = lexResult.tokens.map(token => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).to.deep.equal([
      {
        image: '{',
        type: dustStart,
      },
      {
        image: 'reference',
        type: key,
      },
      {
        image: '|',
        type: bar,
      },
      {
        image: 'filter1',
        type: key,
      },
      {
        image: '|',
        type: bar,
      },
      {
        image: 'filter2',
        type: key,
      },
      {
        image: '}',
        type: closingDustTagEnd,
      },
    ]);
  });

  it('can lex dust attributes', () => {
    const inputText = '{>"somereference{}" param="doublequote {abc|filter1} abc" param2=true /}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
    const tokens = lexResult.tokens.map(token => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).to.deep.equal([
      {
        image: '{',
        type: dustStart,
      },
      {
        image: '>',
        type: gt,
      },
      {
        image: '"somereference{}"',
        type: quotedKey,
      },
      {
        image: 'param',
        type: key,
      },
      {
        image: '="',
        type: startDustQuotedParam,
      },
      {
        image: 'doublequote ',
        type: dustQuoteBuffer,
      },
      {
        image: '{',
        type: dustStart,
      },
      {
        image: 'abc',
        type: key,
      },
      {
        image: '|',
        type: bar,
      },
      {
        image: 'filter1',
        type: key,
      },
      {
        image: '}',
        type: closingDustTagEnd,
      },
      {
        image: ' abc',
        type: dustQuoteBuffer,
      },
      {
        image: '"',
        type: endDustQuote,
      },
      {
        image: 'param2',
        type: key,
      },
      {
        image: '=',
        type: equals,
      },
      {
        image: 'true',
        type: key,
      },
      {
        image: '/}',
        type: selfClosingDustTagEnd,
      },
    ]);
  });

  it('can lex number params', () => {
    const inputText = `{<r numParam=5 numParam2=-40 floatParam1=4.5 floatParam2=-4.5 /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
    const tokens = lexResult.tokens.map(token => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).to.deep.equal([
      {
        image: '{',
        type: dustStart,
      },
      {
        image: '<',
        type: lt,
      },
      {
        image: 'r',
        type: key,
      },
      {
        image: 'numParam',
        type: key,
      },
      {
        image: '=',
        type: equals,
      },
      {
        image: '5',
        type: unsignedInteger,
      },
      {
        image: 'numParam2',
        type: key,
      },
      {
        image: '=',
        type: equals,
      },
      {
        image: '-40',
        type: signedInteger,
      },
      {
        image: 'floatParam1',
        type: key,
      },
      {
        image: '=',
        type: equals,
      },
      {
        image: '4.5',
        type: float,
      },
      {
        image: 'floatParam2',
        type: key,
      },
      {
        image: '=',
        type: equals,
      },
      {
        image: '-4.5',
        type: float,
      },
      {
        image: '/}',
        type: selfClosingDustTagEnd,
      },
    ]);
  });

  it('can lex blank lines', () => {
    const inputText = `
      <div attr="a">a b</div>`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex html with dust attribute', () => {
    const inputText = '<div attr="a" data-test-foo {abc}>some content</div>';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex html dust mix', () => {
    const inputText = `
<form method="get" action="/some/url" class="{className}">
  <label for="labelInput" class="sr">{some_value}</label>
  {@component 
      name="some/path/here"
      placeholder=some_value
      value=keywords
      inputName="keywords"
      class="some-class"
      id="keyword-box"}
    {^isFoo}
      {@someFoo name="name"}
        {@yield name="name"}
          {some_reference_here}
        {/yield}
      {/contentFor}
    {/isFoo}
</form>
`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex } inside dust param', () => {
    const inputText = `{#section param="}" /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex quoted partial reference', () => {
    const inputText = `{>"somereference{}" param="\\\\"b\\\\"" /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });
});
