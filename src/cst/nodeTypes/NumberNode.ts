import Node from './Node';
import { INumber, ISource, NODE_TYPE } from './NodeTypes';

export default class NumberNode extends Node implements INumber {
  constructor(
    public readonly num: number,
    source: ISource,
  ) {
    super(NODE_TYPE.NUMBER, source);
  }
}
