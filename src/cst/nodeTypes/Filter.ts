import Node from './Node';
import { IFilter, ISource, NODE_TYPE } from './NodeTypes';

export default class Filter extends Node implements IFilter {
  constructor(
    public readonly filter: string,
    source: ISource,
  ) {
    super(NODE_TYPE.FILTER, source);
  }
}
