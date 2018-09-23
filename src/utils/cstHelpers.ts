import { CstElement, CstNode, IToken } from 'chevrotain';
import { ISource } from '../cst/nodeTypes/NodeTypes';

export function cstElementToSource(node: CstElement): ISource {
  if (isIToken(node)) {
    return tokenToSource(node);
  }

  return { start: {}, end: {}, raw: '' };
}

export function tokenToSource(node: IToken): ISource {
  return {
    start: {
      line: node.startLine,
      column: node.startColumn,
    },
    end: {
      line: node.endLine,
      column: node.endColumn,
    },
    raw: node.image,
  };
}

/**
 * Typeguard for {@link IToken} given a {@link CstElement}.
 * @param node - the node to check
 * @return - is the node an {@link IToken}
 */
export function isIToken(node: CstElement): node is IToken {
  return (node as IToken).image !== undefined;
}

/**
 * Typeguard for {@link CstNode} given a {@link CstElement}.
 * @param node - the node to check
 * @return - is the node a {@link CstNode}
 */
export function isCstNode(node: CstElement): node is CstNode {
  return (node as CstNode).children !== undefined;
}
