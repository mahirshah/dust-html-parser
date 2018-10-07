import { INode, ISource, NODE_TYPE } from './NodeTypes';

/**
 * Parent class of all AST nodes.
 */
export default class Node implements INode {
  constructor(
    /**
     * see NODE_TYPE
     */
    public readonly type: NODE_TYPE,
    /**
     * An object containing the source code info of this node,
     * including the raw text this node represents from the input stream,
     * as well as the line/column info for the start and end of this node in
     * the input stream.
     */
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

  /**
   * Returns a POJO representation of this node, while recursively
   * providing a POJO representation for all child nodes, by calling
   * {@link toObject} on child nodes. This is very useful for testing
   * and debugging processes, when the entire AST needs to be easily examined.
   */
  public toObject(): object {
    return Object.getOwnPropertyNames(this)
      .map((
        propertyName: string,
      ): [string, any] => {
        const propertyValue = (this as any)[propertyName];

        return (function resolveObject(value): any {
          if (value instanceof Node) {
            return [propertyName, value.toObject()];
          } else if (Array.isArray(value)) {
            return [
              propertyName,
              value.map(val => resolveObject(val)),
            ];
          }

          return [propertyName, propertyValue];
        })(propertyValue);
      },
      this)
      .reduce(
        (object: object, [name, value]): object => ({
          [name]: value,
          ...object,
        }),
        {},
      );
  }
}
