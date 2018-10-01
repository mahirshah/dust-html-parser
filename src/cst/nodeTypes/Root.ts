import Node from './Node';
import { INode, IRoot, ISource, NODE_TYPE } from './NodeTypes';

export default class Root extends Node implements IRoot {
  public readonly nodes: INode[];

  constructor(source: ISource, nodes: INode[]) {
    super(NODE_TYPE.ROOT, source);
    this.nodes = nodes;
  }
}
