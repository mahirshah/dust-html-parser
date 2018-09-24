import Node from './Node';
import { IParam, ISource, NODE_TYPE, ParamValue } from './NodeTypes';

export default class Param extends Node implements IParam {
  constructor(
    public readonly key: string,
    public readonly value: ParamValue,
    source: ISource,
  ) {
    super(NODE_TYPE.PARAM, source);
  }
}
