import Node from './Node';
import {
  AttributeName,
  AttributeValue,
  IAttribute,
  ISource,
  NODE_TYPE,
} from './NodeTypes';

/**
 * An HTML attribute
 */
export default class Attribute extends Node implements IAttribute {
  constructor(
    /**
     * The attribute name for this attribute. Can be either a string or
     * a reference. If this attribute is a boolean attribute (disabled, for
     * example), only attribute name will be set.
     */
    public readonly attributeName: AttributeName,
    /**
     * The attribute value for this attribute. Can be either a string,
     * containing the surrounding attribute quotes ("foo", for example), or
     * a dust reference. This value will be null for boolean attributes.
     */
    public readonly attributeValue: AttributeValue,
    /**
     * Indicates if this attribute is a boolean HTML attribute. See
     * `html boolean attributes <https://www.w3.org/TR/2008/WD-html5-20080610/semantics.html>`_
     */
    public readonly isBooleanAttribute: boolean,
    source: ISource,
  ) {
    super(NODE_TYPE.ATTRIBUTE, source);
  }
}
