import Node from './Node';
import { INumber, IParam, IPath, ISource, NODE_TYPE } from './NodeTypes';

export default class Param extends Node implements IParam {
  constructor(
    public readonly key: string,
    public readonly value: INumber | string | IPath,
    source: ISource,
  ) {
    super(NODE_TYPE.PARAM, source);
  }
}
