import { parse } from '../../src/parse';

describe('Parser', () => {
  const dataProvider = [
    '{@component}{/component}',
    '{@component}Text{/  component  }',
    '{! hello!\n\n hello! !}',
    '{reference|filter1|filter2}',
    '{#somePath[0]}{/somePath[0]}',
    '{>"somereference{}" param="doublequote {abc|filter1} abc" param2=true /}',
    `{<r numParam=5 numParam2=-40 floatParam1=4.5 floatParam2=-4.5 /}`,
    '{>r /}',
    '{>"r" /}',
    '{+r/}',
    '{+r}foo{/r}',
    '{+r.a}abc{/r.a}',
    '<div attr="a">a b</div>',
    '<div attr="a" data-test-foo {abc}>some content</div>',
    '<br attr="a\'<>" data-test-foo {abc}/>',
    `<form method="get" action="/some/url" class="{className}">
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
</form>`,
    '`{#section param="}" /}`',
    '`{>"somereference{}" param="\\\\"b\\\\"" /}`',
  ];

  dataProvider.forEach((input) => {
    it(`should parse ${input}`, () => {
      const parseResult = parse(input);

      expect(parseResult).toBeTruthy();
    });
  });
});
