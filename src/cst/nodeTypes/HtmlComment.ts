import Node from './Node';
import { IHtmlComment, ISource, NODE_TYPE } from './NodeTypes';

export default class HtmlComment extends Node implements IHtmlComment {
  public readonly text: string;

  constructor(source: ISource) {
    super(NODE_TYPE.HTML_TAG, source);
    this.text = source.raw.slice(3, -3);
  }
}
