import Node from './Node';
import { Inline, IQuotedDustValue, ISource, NODE_TYPE } from './NodeTypes';

export default class QuotedDustValue extends Node implements IQuotedDustValue {
  constructor(public readonly valueArray: Inline[], source: ISource) {
    super(NODE_TYPE.QUOTED_DUST_VALUE, source);
  }
}
