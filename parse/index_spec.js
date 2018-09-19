const { expect } = require('chai');
const { parse } = require('./index');

describe('Test Parser', () => {
  it('can parse simple input', () => {
    const inputText = '{@component}{/component}';
    const parseResult = parse(inputText);

    expect(parseResult.errors).to.be.empty;
  });
});
