import Node from './Node';
import { IEscapedQuote, ISource, NODE_TYPE } from './NodeTypes';

export default class EscapedQuote extends Node implements IEscapedQuote {
  constructor(public readonly escapedQuote: string, source: ISource) {
    super(NODE_TYPE.ESCAPED_QUOTE, source);
  }
}
