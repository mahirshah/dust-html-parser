import Node from './Node';
import { IContext, ISource, NODE_TYPE } from './NodeTypes';
import Path from './Path';

export default class Context extends Node implements IContext {
  constructor(
    public readonly identifier: Path,
    source: ISource,
  ) {
    super(NODE_TYPE.CONTEXT, source);
  }
}
