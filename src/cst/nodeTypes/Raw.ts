import Node from './Node';
import { IRaw, ISource } from './NodeTypes';

export const type = 'Raw';

export default class Raw extends Node implements IRaw {
  public readonly text: string;

  constructor(source: ISource) {
    super(type, source);
    this.text = this.source.raw.substring(2, this.source.raw.length - 2);
  }
}
