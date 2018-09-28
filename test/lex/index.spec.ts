import { lex, tokenVocabulary } from '../../src/lex';

const {
  comment,
  raw,
  dustElse,
  dustStart,
  htmlStartTag,
  htmlComment,
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
  endDustQuote,
  htmlSelfClosingTagEnd,
  htmlTagEnd,
  attributeName,
  attributeEquals,
  attributeValue,
  attributeWhiteSpace,
} = tokenVocabulary;

describe('Lexer', () => {
  test('can lex simple input', () => {
    const inputText = '{@component}Text{/  component  }';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex comments', () => {
    const inputText = '{! hello!\n\n hello! !}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    expect(lexResult.tokens).toHaveLength(1);
    expect(lexResult.tokens[0].tokenType).toBe(comment);
  });

  test('can lex raw dust tags', () => {
    const inputText = '{` hello!\n`\n} h{ello! `}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    expect(lexResult.tokens).toHaveLength(1);
    expect(lexResult.tokens[0].tokenType).toBe(raw);
  });

  test('can lex html comments', () => {
    const inputText = `<!-- abc - 
sadljlad
asd;kasd;
<something here>

-- ! -->`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    expect(lexResult.tokens).toHaveLength(1);
    expect(lexResult.tokens[0].tokenType).toBe(htmlComment);
  });

  test('can lex a reference with filters', () => {
    const inputText = '{reference|filter1|filter2}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);

    const tokens = lexResult.tokens.map((token) => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).toMatchObject([
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

  test('can lex section keys that are paths', () => {
    const inputText = '{#somePath[0]}{/somePath[0]}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex dust attributes', () => {
    const inputText = '{>"somereference{}" param="doublequote {abc|filter1} abc" param2=true /}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    const tokens = lexResult.tokens.map((token) => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).toMatchObject([
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

  test('can lex number params', () => {
    const inputText = `{<r numParam=5 numParam2=-40 floatParam1=4.5 floatParam2=-4.5 /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    const tokens = lexResult.tokens.map((token) => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).toMatchObject([
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

  test('can lex body contexts', () => {
    const inputText = `{<r[0] param=true}{:foo}{/r[0]}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex blank lines', () => {
    const inputText = `
      <div attr="a">a b</div>`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex html with dust attribute', () => {
    const inputText = '<div attr="a" data-test-foo {abc}>some content</div>';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex self closing html tags', () => {
    const inputText = '<br attr="a\'<>" data-test-foo {abc}/>';
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
    const tokens = lexResult.tokens.map((token) => ({
      image: token.image,
      type: token.tokenType,
    }));
    expect(tokens).toMatchObject([
      {
        image: '<br',
        type: htmlStartTag,
      },
      {
        image: 'attr',
        type: attributeName,
      },
      {
        image: '=',
        type: attributeEquals,
      },
      {
        image: '"a\'<>"',
        type: attributeValue,
      },
      {
        image: 'data-test-foo',
        type: attributeName,
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
        image: '}',
        type: closingDustTagEnd,
      },
      {
        image: '/>',
        type: htmlSelfClosingTagEnd,
      },
    ]);
  });

  test('can lex html dust mix', () => {
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
      {/someFoo}
    {/isFoo}
  {/component}
</form>
`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex } inside dust param', () => {
    const inputText = `{#section param="}" /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });

  test('can lex quoted partial reference', () => {
    const inputText = `{>"somereference{}" param="\\\\"b\\\\"" /}`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).toHaveLength(0);
  });
});
