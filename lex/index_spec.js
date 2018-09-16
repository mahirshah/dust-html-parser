const { expect } = require('chai');
const { lex } = require('./index');

describe('Test Lexer', () => {
  it('can lex simple input', () => {
    const inputText = '{@component}Text{/component}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex comments', () => {
    const inputText = '{! hello!\n\n hello! !}';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
    expect(lexResult.tokens).to.have.lengthOf(1);
    expect(lexResult.tokens[0].tokenType.name).to.equal('comment');
  });

  it('can lex html', () => {
    const inputText = '<div attr="a">a</div>';
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex blank lines', () => {
    const inputText = `
      <div attr="a">a b</div>`;
    const lexResult = lex(inputText);

    expect(lexResult.errors).to.be.empty;
  });

  it('can lex html dust mix', () => {
    const inputText = `
<form method="get" action="/jobs/search" class="{@BEMSelector/} {className}">
  <label for="keyword-box-input" class="sr-only">{i18n_search_label}</label>
  {@component name="templates/common/components/typeahead"
      placeholder=i18n_keyword_search_placeholder
      value=keywords
      inputName="keywords"
      class="job-search__input"
      id="keyword-box"}
    {^isMobile}
      {@contentFor name="label"}
        {@yield name="keyword_label"}
          {i18n_find}
        {/yield}
      {/contentFor}
    {/isMobile}
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
});

