import Node from './Node';
import {
  AttributeName, AttributeValue,
  IAttribute,
  IReference,
  ISource,
  NODE_TYPE,
} from './NodeTypes';

export default class Attribute extends Node implements IAttribute {
  constructor(
    public readonly attributeName: AttributeName,
    public readonly attributeValue: AttributeValue,
    public readonly isBooleanAttribute: boolean,
    source: ISource,
  ) {
    super(NODE_TYPE.ATTRIBUTE, source);
  }
}
