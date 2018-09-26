import Node from './Node';
import { IBody, IContext, IRoot, ISource, NODE_TYPE } from './NodeTypes';

export default class Body extends Node implements IBody {
  constructor(
    public readonly context: IContext | null,
    public readonly root: IRoot,
    source: ISource,
  ) {
    super(NODE_TYPE.BODY, source);
  }
}
