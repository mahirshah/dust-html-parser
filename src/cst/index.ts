import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { parse, parserInstance } from '../parse';
import {
  isCstNode,
  isIToken,
  tokenToEndPosition,
  tokenToSource,
  tokenToStartPosition,
} from '../utils/cstHelpers';
import DustComment from './nodeTypes/DustComment';
import Raw from './nodeTypes/Raw';
import Root from './nodeTypes/Root';
import {
  AttributeName,
  IAttribute,
  IBody,
  IContext,
  IEscapedQuote,
  IFilter,
  Inline,
  INode,
  INumber,
  IParam,
  IPath,
  IPosition,
  IQuotedDustValue,
  IReference,
  IRoot,
  ISection,
  ISource,
  ISpecial,
  IStringBuffer,
  ParamValue,
} from './nodeTypes/NodeTypes';
import Section from './nodeTypes/Section';
import Optional from 'typescript-optional';
import Path from './nodeTypes/Path';
import Context from './nodeTypes/Context';
import Param from './nodeTypes/Param';
import NumberNode from './nodeTypes/NumberNode';
import Special from './nodeTypes/Special';
import EscapedQuote from './nodeTypes/EscapedQuote';
import StringBuffer from './nodeTypes/StringBuffer';
import QuotedDustValue from './nodeTypes/QuotedDustValue';
import Reference from './nodeTypes/Reference';
import Filter from './nodeTypes/Filter';
import Body from './nodeTypes/Body';
import HtmlTag from './nodeTypes/HtmlTag';
import Attribute from './nodeTypes/Attribute';
import HtmlComment from './nodeTypes/HtmlComment';

/**
 * The CST Visitor for the Dust-HTML parser--{@link parserInstance}. Each method
 * on this class corresponds to a parser rule on the {@link parserInstance}.
 * When a parser rule is encountered, the produced {@link CstChildrenDictionary}
 * is passed to the corresponding method on the {@link DustHtmlVisitor} class.
 *
 * @see {@link http://sap.github.io/chevrotain/docs/guide/concrete_syntax_tree.html#cst-visitor}
 */
class DustHtmlVisitor extends parserInstance.getBaseCstVisitorConstructorWithDefaults() {
  private inputByLine: string[] = [];

  constructor() {
    super();
    this.validateVisitor();
  }

  public parse(inputText: string, cst: CstNode) {
    this.inputByLine = inputText.split(/\r?\n/);
    return this.visit(cst);
  }

  /**
   * Given a start {@link IPosition} and end {@link IPosition}, return the
   * raw string from the original input text.
   * @param startLine
   * @param startColumn
   * @param endLine
   * @param endColumn
   */
  private getRawSourceFromPosition(
    { line: startLine = 0, column: startColumn = 0 }: IPosition,
    { line: endLine = 0, column: endColumn = 0 }: IPosition,
  ): string {
    const startString = this.inputByLine[startLine - 1] || '';
    const endString = this.inputByLine[endLine - 1] || '';

    // if the given positions don't span multiple lines, return the
    // start string from startColumn to endColumn. Else return the joined lines
    return startLine === endLine
      ? startString.slice(startColumn - 1, endColumn)
      : [
          startString.slice(startColumn - 1),
          ...this.inputByLine.slice(startLine, endLine - 1),
          endColumn === 1 ? '' : endString.slice(0, endColumn),
        ].join('\n');
  }

  private body(cst: CstChildrenDictionary) {
    const parts: INode[] = Optional.ofNullable(cst.part)
      .map(elements => elements.filter(isCstNode).map(node => this.visit(node)))
      .orElseGet(() => []);
    const startPosition = Optional.ofNullable(parts[0])
      .map(part => part.source.start)
      .orElseGet(() => ({ line: undefined, column: undefined }));
    const endPosition = Optional.ofNullable(parts[parts.length - 1])
      .map(part => part.source.end)
      .orElseGet(() => ({ line: undefined, column: undefined }));

    return new Root(
      {
        raw: this.getRawSourceFromPosition(startPosition, endPosition),
        start: startPosition,
        end: endPosition,
      },
      parts,
    );
  }

  private part(cst: CstChildrenDictionary) {
    const alternationValue = Object.values(cst)[0][0];
    return this.visit(alternationValue as CstNode);
  }

  // the tokenizer stops adding to the buffer token when it encounters an
  // ambiguous character. For example, when it encounters a "{", the tokenizer
  // stops adding the to the buffer token and determines whether the "{" is
  // a dustStart or simply a char. If it is determined to be a char, we can
  // manually add it to the buffer node in the cst visitor.
  private part$buffer(cst: CstChildrenDictionary) {
    const bufferOrCharSources: ISource[] = cst.bufferOrChar
      .filter(isCstNode)
      .map(node => this.visit(node));
    const rawString = bufferOrCharSources.map(source => source.raw).join('');
    const startPosition = bufferOrCharSources[0].start;
    const endPosition = bufferOrCharSources[bufferOrCharSources.length - 1].end;

    return new StringBuffer(rawString, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private bufferOrChar(cst: CstChildrenDictionary): ISource {
    return Optional.ofNullable(cst.buffer)
      .or(() => Optional.ofNullable(cst.char))
      .map(elements => elements.filter(isIToken)[0])
      .map(tokenToSource)
      .orElseThrow(() => new Error('expected char or buffer'));
  }

  // todo: if key !== closingDustTag key we should throw a parse error
  private section(cst: CstChildrenDictionary) {
    const dustSectionCharacterPrefix = (Object.values(
      (cst.dustSectionCharacterPrefix[0] as CstNode).children,
    )[0][0] as IToken).image;
    const key: IPath = this.visit(cst.identifier[0] as CstNode);
    const context: IContext | null = this.visit(cst.context[0] as CstNode);
    const params: IParam[] = this.visit(cst.params[0] as CstNode);
    const maybeSelfClosingDustTag = Optional.ofNullable(
      cst.selfClosingDustTagEnd,
    );
    const otherBodies = Optional.ofNullable(cst.contextBody)
      .map(bodies => bodies.filter(isCstNode))
      .map(bodies => bodies.map(body => this.visit(body)))
      .orElseGet(() => []);
    const mainBody = Optional.ofNullable(cst.body)
      .map(bodies => bodies.filter(isCstNode)[0])
      .map(body => this.visit(body))
      .map((root: IRoot) => new Body(null, root, root.source))
      .orNull();
    const allBodies = Optional.ofNullable(mainBody)
      .map(body => [body])
      .orElseGet(() => [])
      .concat(otherBodies);
    const endPosition = maybeSelfClosingDustTag
      .or(() => Optional.ofNullable(cst.closingDustTag))
      .map(elements => elements.filter(isIToken)[0])
      .map(tokenToEndPosition)
      .orElseThrow(
        () => new Error('expected self closing section or closing dust tag'),
      );
    const startPosition = tokenToStartPosition(
      cst.dustStart.filter(isIToken)[0],
    );

    return new Section(
      dustSectionCharacterPrefix,
      key,
      context,
      params,
      allBodies,
      maybeSelfClosingDustTag.isPresent,
      {
        raw: this.getRawSourceFromPosition(startPosition, endPosition),
        start: startPosition,
        end: endPosition,
      },
    );
  }

  private params(cst: CstChildrenDictionary): IParam[] {
    return Optional.ofNullable(cst.param)
      .map(params => params.filter(isCstNode))
      .map(params => params.map(param => this.visit(param)))
      .orElseGet(() => []);
  }

  private param(cst: CstChildrenDictionary): IParam {
    const key = cst.key.filter(isIToken)[0];
    const value: ParamValue = Optional.ofNullable(cst.number)
      .or(() => Optional.ofNullable(cst.identifier))
      .or(() => Optional.ofNullable(cst.$inlineStringParamValue))
      .map(elements => elements.filter(isCstNode)[0])
      .map(node => this.visit(node))
      .orElseThrow(
        () => new Error('expected number, identifier, or inline string param'),
      );
    const startPosition = tokenToStartPosition(key);
    const endPosition = value.source.end;

    return new Param(key.image, value, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private param$inlineStringParamValue(
    cst: CstChildrenDictionary,
  ): IQuotedDustValue {
    return this.visit(cst.inlineWithoutStartQuote[0] as CstNode);
  }

  private reference(cst: CstChildrenDictionary): IReference {
    const path: IPath = this.visit(cst.identifier.filter(isCstNode)[0]);
    const filters: IFilter[] = this.visit(cst.filters.filter(isCstNode)[0]);
    const startBrace = cst.dustStart.filter(isIToken)[0];
    const endBrace = cst.closingDustTagEnd.filter(isIToken)[0];
    const startPosition = tokenToStartPosition(startBrace);
    const endPosition = tokenToEndPosition(endBrace);

    return new Reference(path, filters, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private filters(cst: CstChildrenDictionary): IFilter[] {
    return Optional.ofNullable(cst.key)
      .map(keys => keys.filter(isIToken))
      .map(keys =>
        keys.map(
          key =>
            new Filter(key.image, {
              raw: `|${key.image}`,
              start: {
                line: key.startLine,
                // subtract 1 to account for `|` preceeding key token
                column: (key.startColumn || 1) - 1,
              },
              end: tokenToEndPosition(key),
            }),
        ),
      )
      .orElseGet(() => []);
  }

  private selfClosingBlock(cst: CstChildrenDictionary) {
    const dustSectionCharacterPrefix = (Object.values(
      (cst.dustSectionCharacterPrefix[0] as CstNode).children,
    )[0][0] as IToken).image;
    const key = cst.quotedKey.filter(isIToken)[0];
    const context: IContext | null = this.visit(cst.context[0] as CstNode);
    const params: IParam[] = this.visit(cst.params[0] as CstNode);
    const endPosition = tokenToEndPosition(
      cst.selfClosingDustTagEnd.filter(isIToken)[0],
    );
    const startPosition = tokenToStartPosition(
      cst.dustStart.filter(isIToken)[0],
    );

    return new Section(
      dustSectionCharacterPrefix,
      new Path(key.image, tokenToSource(key)),
      context,
      params,
      [],
      true,
      {
        raw: this.getRawSourceFromPosition(startPosition, endPosition),
        start: startPosition,
        end: endPosition,
      },
    );
  }

  private partial(cst: CstChildrenDictionary): ISection {
    const key = Optional.ofNullable(cst.quotedKey)
      .or(() => Optional.ofNullable(cst.key))
      .map(elements => elements.filter(isIToken)[0])
      .orElseThrow(() => new Error('expected key or quoted key'));
    const context: IContext | null = this.visit(cst.context[0] as CstNode);
    const params: IParam[] = this.visit(cst.params[0] as CstNode);
    const endPosition = tokenToEndPosition(
      cst.selfClosingDustTagEnd.filter(isIToken)[0],
    );
    const startPosition = tokenToStartPosition(
      cst.dustStart.filter(isIToken)[0],
    );

    return new Section(
      '>',
      new Path(key.image, tokenToSource(key)),
      context,
      params,
      [],
      true,
      {
        raw: this.getRawSourceFromPosition(startPosition, endPosition),
        start: startPosition,
        end: endPosition,
      },
    );
  }

  private inlineWithoutStartQuote(
    cst: CstChildrenDictionary,
  ): IQuotedDustValue {
    const maybeInlines = Optional.ofNullable(cst.inline)
      .map(inlineNodes => inlineNodes.filter(isCstNode))
      .map(inlineNodes => inlineNodes.map(node => this.visit(node)));
    const inlines = maybeInlines.orElseGet(() => []);
    const endPosition = tokenToEndPosition(
      cst.endDustQuote.filter(isIToken)[0],
    );
    const startPosition = Optional.ofNullable(inlines[0])
      .map(inline => inline.source.start)
      .orElseGet(
        () => cst.endDustQuote.filter(isIToken).map(tokenToSource)[0].start,
      );
    // we assume the start quote will be there, so we the start position of this
    // node is actually the start position column - 1
    const startPositionWithStartQuote = {
      line: startPosition.line,
      column: (startPosition.column || 0) - 1,
    };

    return new QuotedDustValue(inlines, {
      raw: this.getRawSourceFromPosition(
        startPositionWithStartQuote,
        endPosition,
      ),
      start: startPositionWithStartQuote,
      end: endPosition,
    });
  }

  private inline(cst: CstChildrenDictionary): Inline {
    return Optional.ofNullable(cst.special)
      .or(() => Optional.ofNullable(cst.reference))
      .map(elements => elements.filter(isCstNode)[0])
      .map(node => this.visit(node))
      .orElseGet(
        (): IEscapedQuote | IStringBuffer => {
          const maybeEscapedQuote: Optional<
            IEscapedQuote | IStringBuffer
          > = Optional.ofNullable(cst.escapedQuote)
            .map(elements => elements.filter(isIToken)[0])
            .map(token => new EscapedQuote(token.image, tokenToSource(token)));
          const maybeStringBuffer = Optional.ofNullable(cst.dustQuoteBuffer)
            .map(elements => elements.filter(isIToken)[0])
            .map(token => new StringBuffer(token.image, tokenToSource(token)));

          return maybeEscapedQuote
            .or(() => maybeStringBuffer)
            .orElseThrow(
              () => new Error('excpected escapedQuote or stringBuffer'),
            );
        },
      );
  }

  private special(cst: CstChildrenDictionary): ISpecial {
    const key = cst.key.filter(isIToken)[0];
    const dustStart = cst.dustStart.filter(isIToken)[0];
    const closingDustTagEnd = cst.closingDustTagEnd.filter(isIToken)[0];
    const startPosition = tokenToStartPosition(dustStart);
    const endPosition = tokenToEndPosition(closingDustTagEnd);

    return new Special(key.image, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private number(cst: CstChildrenDictionary): INumber {
    const numberToken: IToken = Object.values(cst)[0][0] as IToken;

    return new NumberNode(+numberToken.image, tokenToSource(numberToken));
  }

  private contextBody(cst: CstChildrenDictionary): IBody {
    const root: IRoot = this.visit(cst.body.filter(isCstNode)[0]);
    const contextToken = cst.dustContext.filter(isIToken)[0];
    const contextKey = Optional.ofNullable(
      contextToken.image.match(/{:([^}]+)}/),
    )
      .map(match => match[1])
      .orElseThrow(
        () =>
          new Error(
            'error parsing dustContext token key: context key not found',
          ),
      );
    const context = new Context(
      new Path(contextKey, tokenToSource(contextToken)),
      tokenToSource(contextToken),
    );
    const startPosition = tokenToStartPosition(contextToken);
    const endPosition = root.source.end;

    return new Body(context, root, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private context(cst: CstChildrenDictionary): IContext | null {
    return Optional.ofNullable(cst.colon)
      .map(colons => {
        const colonToken = colons.filter(isIToken)[0];
        const path: Path = this.visit(cst.path[0] as CstNode);
        const startPosition = tokenToStartPosition(colonToken);
        const endPosition = path.source.end;

        return new Context(path, {
          raw: this.getRawSourceFromPosition(startPosition, endPosition),
          start: startPosition,
          end: endPosition,
        });
      })
      .orNull();
  }

  private identifier(cst: CstChildrenDictionary): Path {
    if (cst.key) {
      const keyToken = cst.key[0] as IToken;
      return new Path(keyToken.image, tokenToSource(keyToken));
    }

    return this.visit(cst.path[0] as CstNode);
  }

  private path(cst: CstChildrenDictionary) {
    return Optional.ofNullable(cst.$path1)
      .map(path1Nodes => path1Nodes.filter(isCstNode)[0])
      .map(
        (node): ISource => {
          const arraySource: ISource[] = Optional.ofNullable(
            node.children.array,
          )
            .map(arrays =>
              arrays.filter(isCstNode).map(array => this.visit(array)),
            )
            .orElseGet(() =>
              node.children.arrayPart
                .filter(isCstNode)
                .map(arrayPart => this.visit(arrayPart)),
            );
          const rawArray = arraySource.map(array => array.raw).join('');
          const maybeKey = Optional.ofNullable(node.children.key).map(
            keys => keys[0] as IToken,
          );
          const rawKey = maybeKey.map(keyToken => keyToken.image).orElse('');
          const startPosition = maybeKey
            .map(tokenToStartPosition)
            .orElseGet(() => arraySource[0].start);
          const endPosition = arraySource[arraySource.length - 1].end;

          return {
            raw: `${rawKey}${rawArray}`,
            start: startPosition,
            end: endPosition,
          };
        },
      )
      .or(() =>
        Optional.ofNullable(cst.$path2)
          .map(path2Nodes => path2Nodes.filter(isCstNode)[0])
          .map(
            (node): ISource => {
              const dotToken = node.children.dot.filter(isIToken)[0];
              const startPosition = tokenToStartPosition(dotToken);
              const maybeArrays: Optional<ISource[]> = Optional.ofNullable(
                node.children.array,
              )
                .or(() => Optional.ofNullable(node.children.arrayPart))
                .map(arrays =>
                  arrays.filter(isCstNode).map(array => this.visit(array)),
                );
              const rawArrays = maybeArrays
                .orElse([])
                .map(array => array.raw)
                .join('');
              const endPosition = maybeArrays
                .map(arrays => arrays[arrays.length - 1])
                .map(array => array.end)
                .orElseGet(() => tokenToEndPosition(dotToken));

              return {
                raw: this.getRawSourceFromPosition(startPosition, endPosition),
                start: startPosition,
                end: endPosition,
              };
            },
          ),
      )
      .map(source => new Path(source.raw, source))
      .orElseThrow(
        () => new Error('expected cst.$path1 or cst.$path2 to be present'),
      );
  }

  private array(cst: CstChildrenDictionary): ISource {
    const maybeArrayPartSource: Optional<ISource> = Optional.ofNullable(
      cst.arrayPart,
    ).map(arrayPartNodes => this.visit(arrayPartNodes[0] as CstNode));
    const endPosition = maybeArrayPartSource
      .map(source => source.end)
      .orElseGet(() => tokenToEndPosition(cst.rb[0] as IToken));
    const startPosition = tokenToStartPosition(cst.lb[0] as IToken);

    return {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    };
  }

  private arrayPart(cst: CstChildrenDictionary): ISource {
    const keys = cst.key
      .filter(isIToken)
      .map(token => token.image)
      .join('.');
    const maybeArraySource: Optional<ISource> = Optional.ofNullable(
      cst.array,
    ).map(arrayNodes => this.visit(arrayNodes[0] as CstNode));
    const rawArray = maybeArraySource.map(source => source.raw).orElse('');
    const endPosition = maybeArraySource
      .map(source => source.end)
      .orElseGet(() => tokenToEndPosition(cst.key.slice(-1)[0] as IToken));
    const startPosition = tokenToStartPosition(cst.dot[0] as IToken);

    return {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    };
  }

  private commentRule(cst: CstChildrenDictionary) {
    return Optional.ofNullable(cst.comment[0])
      .filter(isIToken)
      .map(token => new DustComment(tokenToSource(token as IToken)))
      .orElseThrow(
        () =>
          new Error(`Expected dust comment token, received: ${cst.comment[0]}`),
      );
  }

  private rawRule(cst: CstChildrenDictionary) {
    const rawNode = cst.raw[0];

    if (isIToken(rawNode)) {
      return new Raw(tokenToSource(rawNode));
    } else {
      throw new Error(`Expected raw token, received: ${rawNode}`);
    }
  }

  // todo: make sure start and end tags are the same
  private htmlNonSelfClosingElement(cst: CstChildrenDictionary) {
    const startTag = cst.htmlStartTag.filter(isIToken)[0];
    const tagName = startTag.image.slice(1);
    const attributes = this.visit(cst.attributes.filter(isCstNode)[0]);
    const bodyOrNull = Optional.ofNullable(cst.body)
      .map(body => body.filter(isCstNode)[0])
      .map(body => this.visit(body))
      .orNull();
    const startPosition = tokenToStartPosition(startTag);
    const endPosition = tokenToEndPosition(cst.closingHtmlTag[0] as IToken);

    return new HtmlTag(tagName, attributes, false, bodyOrNull, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private htmlSelfClosingElement(cst: CstChildrenDictionary) {
    const startTag = cst.voidHtmlStartTag.filter(isIToken)[0];
    const tagName = startTag.image.slice(1);
    const attributes = this.visit(cst.attributes.filter(isCstNode)[0]);
    const startPosition = tokenToStartPosition(startTag);
    const endPosition = Optional.ofNullable(cst.htmlTagEnd)
      .or(() => Optional.ofNullable(cst.htmlSelfClosingTagEnd))
      .map(elements => elements.filter(isIToken)[0])
      .map(tokenToEndPosition)
      .orElseThrow(
        () => new Error('expected self closing tag end, but none parsed'),
      );

    return new HtmlTag(tagName, attributes, true, null, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private attributes(cst: CstChildrenDictionary): IAttribute[] {
    return Optional.ofNullable(cst.attribute)
      .map(elements => elements.filter(isCstNode))
      .map(nodes => nodes.map(node => this.visit(node)))
      .orElseGet(() => []);
  }

  private attribute(cst: CstChildrenDictionary): IAttribute | null {
    const nameTokenOrReference: IToken | IReference = Optional.ofNullable(
      cst.attributeName.filter(isIToken)[0] as IToken | IReference,
    )
      .or(() =>
        Optional.ofNullable(cst.reference.filter(isCstNode)[0]).map(node =>
          this.visit(node),
        ),
      )
      .get();
    const name: string | IReference = isIToken(nameTokenOrReference)
      ? nameTokenOrReference.image
      : nameTokenOrReference;
    const maybeValue = Optional.ofNullable(
      this.visit(cst.attributeValueRule.filter(isCstNode)[0]),
    );
    const valueNode = maybeValue
      .map(valueObject => valueObject.value)
      .orElse(true);
    const startPosition = isIToken(nameTokenOrReference)
      ? tokenToStartPosition(nameTokenOrReference)
      : nameTokenOrReference.source.start;
    const endPosition = maybeValue
      .map(value => value.source.end)
      .orElseGet(
        () =>
          isIToken(nameTokenOrReference)
            ? tokenToEndPosition(nameTokenOrReference)
            : nameTokenOrReference.source.end,
      );

    return new Attribute(name, valueNode, maybeValue.isEmpty, {
      raw: this.getRawSourceFromPosition(startPosition, endPosition),
      start: startPosition,
      end: endPosition,
    });
  }

  private attributeValueRule(cst: CstChildrenDictionary) {
    const maybeEqualsToken = Optional.ofNullable(cst.attributeEquals).map(
      elements => elements.filter(isIToken)[0],
    );

    if (maybeEqualsToken.isEmpty) {
      return null;
    }

    const maybeValue: Optional<IToken | IReference> = Optional.ofNullable(
      cst.attributeValue,
    )
      .map(elements => elements.filter(isIToken)[0])
      .or(() =>
        Optional.ofNullable(cst.reference)
          .map(elements => elements.filter(isCstNode)[0])
          .map(node => this.visit(node)),
      );
    const value = maybeValue.orElseThrow(
      () => new Error('expected token or reference as attribute value'),
    );
    const rawValue = isIToken(value) ? value.image : value.source.raw;

    return {
      value: isIToken(value) ? value.image : value,
      source: {
        raw: `=${rawValue}`,
        start: maybeEqualsToken.map(tokenToStartPosition).get(),
        end: isIToken(value) ? tokenToEndPosition(value) : value.source.end,
      },
    };
  }

  private htmlCommentRule(cst: CstChildrenDictionary) {
    return Optional.ofNullable(cst.htmlComment[0])
      .filter(isIToken)
      .map(token => new HtmlComment(tokenToSource(token as IToken)))
      .orElseThrow(
        () =>
          new Error(`Expected html comment token, received: ${cst.comment[0]}`),
      );
  }
}

export const toAstVisitorInstance = new DustHtmlVisitor();
export function toAst(inputText: string) {
  const cst = parse(inputText);

  return toAstVisitorInstance.parse(inputText, cst);
}
