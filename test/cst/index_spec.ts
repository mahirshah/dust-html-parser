import { expect } from 'chai';
import { toAst } from '../../src/cst';

describe('Test CST Visitor', () => {
  it('cst for dust comment', () => {
    const inputText = '{! comment !}';
    const ast = toAst(inputText);

    expect(true).to.be.true;
  });

  it('cst for dust section', () => {
    const inputText = '{#a[0][1] b=1}abcd{:else}bc{d{/sectionKey}';
    const ast = toAst(inputText);

    expect(true).to.be.true;
  });
});
