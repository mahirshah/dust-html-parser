import Node from './Node';
import { IContext, ISource, NODE_TYPE } from './NodeTypes';

export default class Context extends Node implements IContext {
  constructor(
    public readonly identifier: string,
    source: ISource,
  ) {
    super(NODE_TYPE.CONTEXT, source);
  }
}
