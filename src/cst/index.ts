import { CstChildrenDictionary } from 'chevrotain';
import { parse, parserInstance } from '../parse';
import {
  cstElementToSource,
  isCstNode,
  isIToken,
  tokenToSource,
} from '../utils/cstHelpers';
import DustComment from './nodeTypes/DustComment';
import Raw from './nodeTypes/Raw';
import Root from './nodeTypes/Root';
import { INode } from './nodeTypes/NodeTypes';

// todo: switch back to non default constructor
const BaseDustHtmlVisitor = parserInstance.getBaseCstVisitorConstructorWithDefaults();

class DustHtmlVisitor extends BaseDustHtmlVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  public body(cst: CstChildrenDictionary) {
    const parts = cst.part
      .filter(isCstNode)
      .map((part): INode => this.visit(part));

    // todo: fix the source
    return new Root(cstElementToSource(cst.part[0]), parts);
  }

  public part(cst: CstChildrenDictionary) {
    const alternationValue = Object.values(cst)[0];

    if (alternationValue.length !== 1) {
      throw new Error(
        `expected part to contain 1 alternation subrule, but received ${alternationValue}`,
      );
    }

    const alternationNode = alternationValue[0];
    if (isCstNode(alternationNode)) {
      return this.visit(alternationNode);
    } else {
      // todo: implement $buffer
      throw Error('implement me');
    }
  }

  public section(cst: CstChildrenDictionary) {
    console.log(cst);
  }

  public commentRule(cst: CstChildrenDictionary) {
    const commentNode = cst.comment[0];

    if (isIToken(commentNode)) {
      return new DustComment(tokenToSource(commentNode));
    } else {
      throw new Error(`Expected comment token, received: ${commentNode}`);
    }
  }

  public rawRule(cst: CstChildrenDictionary) {
    const rawNode = cst.raw[0];

    if (isIToken(rawNode)) {
      return new Raw(tokenToSource(rawNode));
    } else {
      throw new Error(`Expected comment token, received: ${rawNode}`);
    }
  }
}

export const toAstVisitorInstance = new DustHtmlVisitor();

export function toAst(inputText: string) {
  const cst = parse(inputText);

  return toAstVisitorInstance.visit(cst);
}
