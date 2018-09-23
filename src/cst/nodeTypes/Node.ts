import { INode, ISource } from './NodeTypes';

export default class Node implements INode {
  constructor(
    public readonly type: string,
    public readonly source: ISource,
  ) {}

  /**
   * Create a copy of this {@link Node}
   * @return a new copy of this Node
   */
  public clone() {
    return new Node(this.type, this.source);
  }

  /**
   * Returns the raw text associated with this node.
   * @return the raw text this node represents.
   */
  public toString() {
    return this.source.raw;
  }
}
