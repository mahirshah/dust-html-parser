import Node from './Node';
import {
  IBody,
  IContext,
  IParam,
  IPath,
  IRoot,
  ISection,
  ISource,
  NODE_TYPE,
} from './NodeTypes';

export default class Section extends Node implements ISection {
  constructor(
    sectionPrefixCharacter: string,
    public readonly key: IPath,
    public readonly context: IContext | null,
    public readonly params: IParam[],
    public readonly bodies: IBody[],
    public readonly selfClosing: boolean,
    source: ISource,
  ) {
    super(Section.determineSectionType(sectionPrefixCharacter), source);
  }

  public static determineSectionType(
    sectionPrefixCharacter: string,
  ): NODE_TYPE {
    const sectionPrefixCharToSectionType: { [key: string]: NODE_TYPE } = {
      '#': NODE_TYPE.SECTION,
      '?': NODE_TYPE.EXISTS,
      '^': NODE_TYPE.NOT_EXISTS,
      '@': NODE_TYPE.HELPER,
      '<': NODE_TYPE.INLINE_PARTIAL,
      '+': NODE_TYPE.SELF_CLOSING_BLOCK,
      '>': NODE_TYPE.PARTIAL,
    };

    return sectionPrefixCharToSectionType[sectionPrefixCharacter];
  }
}
