import Node from './Node';
import { IAttribute, IHtmlTag, IRoot, ISource, NODE_TYPE } from './NodeTypes';

export default class HtmlTag extends Node implements IHtmlTag {
  constructor(
    public readonly tagName: string,
    public readonly attributes: IAttribute[],
    public readonly isSelfClosing: boolean,
    public readonly body: IRoot | null,
    source: ISource,
  ) {
    super(NODE_TYPE.HTML_TAG, source);
  }
}
