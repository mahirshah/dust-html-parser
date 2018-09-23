import Node from './Node';
import { ISource, ISpecial, NODE_TYPE } from './NodeTypes';

export default class Special extends Node implements ISpecial {
  constructor(
    public readonly key: string,
    source: ISource,
  ) {
    super(NODE_TYPE.SPECIAL, source);
  }
}
