import Node from './Node';
import { IRaw, ISource, NODE_TYPE } from './NodeTypes';

export default class Raw extends Node implements IRaw {
  public readonly text: string;

  constructor(source: ISource) {
    super(NODE_TYPE.RAW, source);
    this.text = this.source.raw.substring(2, this.source.raw.length - 2);
  }
}
