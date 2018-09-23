import Node from './Node';
import { IDustComment, INode, IRoot, ISource, NODE_TYPE } from './NodeTypes';

export default class Root extends Node implements IRoot {
  public readonly nodes: INode[];
  public readonly first: INode;
  public readonly last: INode;

  constructor(source: ISource, nodes: INode[]) {
    super(NODE_TYPE.ROOT, source);
    this.nodes = nodes;
    this.first = nodes[0];
    this.last = nodes[nodes.length - 1];
  }
}
