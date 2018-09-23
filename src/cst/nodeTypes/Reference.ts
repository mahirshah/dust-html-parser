import Node from './Node';
import { IFilter, IPath, IReference, ISource, NODE_TYPE } from './NodeTypes';

export default class Reference extends Node implements IReference {
  constructor(
    public readonly path: IPath,
    public readonly filters: IFilter[],
    source: ISource,
  ) {
    super(NODE_TYPE.REFERENCE, source);
  }
}
