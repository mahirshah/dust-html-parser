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
}

export declare interface INode {
  source: ISource;
  type: string;
  clone: () => INode;
  toString: () => string;
}

export declare interface IRoot extends INode {
  nodes: INode[];
  first: INode;
  last: INode;
}

export declare interface ISection extends INode {
  key: string;
  context: IContext;
  params: IParam[];
  body: IRoot;
  elseBody: IRoot;
  selfClosing: boolean;
}

export declare interface IParam extends INode {
  key: string;
  value: INumber | string | IPath;
}

export declare interface IPath extends INode {
  path: string;
}

export declare interface IContext extends INode {
  identifier: string;
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
