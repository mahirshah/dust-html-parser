export enum NODE_TYPE {
  DUST_COMMENT = 'DUST_COMMENT',
  EXISTS = 'EXISTS',
  NOT_EXISTS = 'NOT_EXISTS',
  HELPER = 'HELPER',
  HTML = 'HTML',
  INLINE_PARTIAL = 'INLINE_PARTIAL',
  PARTIAL = 'PARTIAL',
  RAW = 'RAW',
  REFERENCE = 'REFERENCE',
  ROOT = 'ROOT',
  SECTION = 'SECTION',
  SELF_CLOSING_BLOCK = 'SELF_CLOSING_BLOCK',
  SPECIAL = 'SPECIAL',
  PARAM = 'PARAM',
  CONTEXT = 'CONTENT',
  FILTER = 'FILTER',
  NUMBER = 'NUMBER',
  PATH = 'PATH',
  STRING_BUFFER = 'STRING_BUFFER',
  ESCAPED_QUOTE = 'ESCAPED_QUOTE',
  QUOTED_DUST_VALUE = 'QUOTED_DUST_VALUE',
}

export declare interface INode {
  source: ISource;
  type: NODE_TYPE;
  clone: () => INode;
  toString: () => string;
}

export declare interface IRoot extends INode {
  nodes: INode[];
  first: INode;
  last: INode;
}

export declare interface ISection extends INode {
  key: IPath;
  context: IContext | null;
  params: IParam[];
  body: IRoot | null;
  elseBody: IRoot | null;
  selfClosing: boolean;
}

export declare interface IParam extends INode {
  key: string;
  value: ParamValue;
}

export declare type ParamValue = INumber | IQuotedDustValue | IPath;

export declare interface IQuotedDustValue extends INode {
  valueArray: Inline[];
}

export declare interface IStringBuffer extends INode {
  buffer: string;
}

export declare interface IEscapedQuote extends INode {
  escapedQuote: string;
}

export declare type Inline = IReference | ISpecial | IStringBuffer | IEscapedQuote;

export declare interface IPath extends INode {
  path: string;
}

export declare interface IContext extends INode {
  identifier: IPath;
}

export declare interface IReference extends INode {
  path: IPath;
  filters: IFilter[];
}

export declare interface IFilter extends INode {
  filter: string;
}

export declare interface ISpecial extends INode {
  key: string;
}

export declare interface INumber extends INode {
  num: number;
}

export declare interface IDustComment extends INode {
  text: string;
}

export declare interface IRaw extends INode {
  text: string;
}

export declare interface IPosition {
  line?: number;
  column?: number;
}

export declare interface ISource {
  raw: string;
  start: IPosition;
  end: IPosition;
}
