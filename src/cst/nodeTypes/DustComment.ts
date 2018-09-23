import Node from './Node';
import { IDustComment, ISource, NODE_TYPE } from './NodeTypes';

export default class DustComment extends Node implements IDustComment {
  public readonly text: string;

  constructor(source: ISource) {
    super(NODE_TYPE.DUST_COMMENT, source);
    this.text = this.source.raw.substring(2, this.source.raw.length - 2);
  }
}
