import { expect } from 'chai';
import { parse } from '../../src/parse';

describe('Test Parser', () => {
  it('can parse simple input', () => {
    const inputText = '{@component}{/component}';
    const parseResult = parse(inputText);

    expect(parseResult.errors).to.be.empty;
  });
});
