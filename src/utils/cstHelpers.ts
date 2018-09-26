import { CstElement, CstNode, IToken } from 'chevrotain';
import { INode, IPosition, ISource } from '../cst/nodeTypes/NodeTypes';
import Optional from 'typescript-optional';

/**
 * Given a token convert it to an {@link ISource} object.
 * @param node - the token
 */
export function tokenToSource(node: IToken): ISource {
  return {
    start: tokenToStartPosition(node),
    end: tokenToEndPosition(node),
    raw: node.image,
  };
}

/**
 * Given a token, get the start position.
 * @param node - the token
 */
export function tokenToStartPosition(node: IToken): IPosition {
  return {
    line: node.startLine,
    column: node.startColumn,
  };
}

/**
 * Given a token, get the end position.
 * @param node - the token
 */
export function tokenToEndPosition(node: IToken): IPosition {
  return {
    line: node.endLine,
    column: node.endColumn,
  };
}

/**
 * Typeguard for {@link IToken} given a {@link CstElement}.
 * @param node - the node to check
 * @return - is the node an {@link IToken}
 */
export function isIToken(node: CstElement | INode): node is IToken {
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

/**
 * A comparator function to pass to {@link Array#sort}. Sorts an
 * {@type Array<INode|IToken>} based on their source start position. If
 * the {@link INode#source.start} is not defined, keep the sort order the same.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort}
 * @param element1 - element in array
 * @param element2 - element in array
 */
export function elementPositionComparator(
  element1: INode | IToken,
  element2: INode | IToken,
) {
  const element1Source = Optional.of(element1)
    .filter(isIToken)
    .map(token => tokenToSource(token as IToken))
    .orElseGet(() => (element1 as INode).source);
  const element2Source = Optional.of(element2)
    .filter(isIToken)
    .map(token => tokenToSource(token as IToken))
    .orElseGet(() => (element2 as INode).source);

  return element1Source.start.line === element2Source.start.line
    ? (element1Source.start.column || 0) - (element2Source.start.column || 0)
    : (element1Source.start.line || 0) - (element2Source.start.line || 0);
}
