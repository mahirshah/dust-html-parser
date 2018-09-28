import { expect } from 'chai';
import { toAst } from '../../src/cst';
import { INode, NODE_TYPE } from '../../src/cst/nodeTypes/NodeTypes';

describe('cst: dust', () => {
  it('comment', () => {
    const inputText = '{! comment !}';
    const ast: INode = toAst(inputText);


  });

  it('raw', () => {

  });
});

// describe('cst: html', () => {
//
// });
//
// describe('cst: html and dust', () => {
//
// });

describe('Test CST Visitor', () => {
  it('dust: comment', () => {
    const inputText = '{! comment !}';
    const ast = toAst(inputText);

    expect(true).to.be.true;
  });

  it('dust: raw', () => {

  });

  it('cst for dust section', () => {
    const inputText = `
{#a[0][1] b=1}
  abcd
{:else}
  bc{d
{/sectionKey}
`;
    const ast = toAst(inputText);

    ast.toObject();
    expect(true).to.be.true;
  });
});
