import Node from './Node';
import { INumber, IPath, ISource, NODE_TYPE } from './NodeTypes';

export default class Path extends Node implements IPath {
  constructor(
    public readonly path: string,
    source: ISource,
  ) {
    super(NODE_TYPE.PATH, source);
  }
}
