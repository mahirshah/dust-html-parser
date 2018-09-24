import Node from './Node';
import { ISource, IStringBuffer, NODE_TYPE } from './NodeTypes';

export default class StringBuffer extends Node implements IStringBuffer {
  constructor(public readonly buffer: string, source: ISource) {
    super(NODE_TYPE.STRING_BUFFER, source);
  }
}
