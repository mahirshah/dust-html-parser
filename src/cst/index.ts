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
  IBody,
  IContext,
  IEscapedQuote,
  IFilter,
  Inline,
  INode, INumber,
  IParam,
  IPath,
  IQuotedDustValue,
  IReference,
  IRoot, ISection,
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

// todo: switch back to non default constructor
const BaseDustHtmlVisitor = parserInstance.getBaseCstVisitorConstructorWithDefaults();

class DustHtmlVisitor extends BaseDustHtmlVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  public body(cst: CstChildrenDictionary) {
    const parts: INode[] = Optional.ofNullable(cst.part)
      .map(elements => elements.filter(isCstNode).map(node => this.visit(node)))
      .orElseGet(() => []);
    const rawParts = parts.map(part => part.source.raw).join('');
    const startPosition = Optional.ofNullable(parts[0])
      .map(part => part.source.start)
      .orElseGet(() => ({ line: undefined, column: undefined }));
    const endPosition = Optional.ofNullable(parts[parts.length - 1])
      .map(part => part.source.end)
      .orElseGet(() => ({ line: undefined, column: undefined }));

    return new Root(
      {
        raw: rawParts,
        start: startPosition,
        end: endPosition,
      },
      parts,
    );
  }

  public part(cst: CstChildrenDictionary) {
    const alternationValue = Object.values(cst)[0][0];
    return this.visit(alternationValue as CstNode);
  }

  // the tokenizer stops adding to the buffer token when it encounters an
  // ambiguous character. For example, when it encounters a "{", the tokenizer
  // stops adding the to the buffer token and determines whether the "{" is
  // a dustStart or simply a char. If it is determined to be a char, we can
  // manually add it to the buffer node in the cst visitor.
  public part$buffer(cst: CstChildrenDictionary) {
    const bufferOrCharSources: ISource[] = cst.bufferOrChar
      .filter(isCstNode)
      .map(node => this.visit(node));
    const rawString = bufferOrCharSources.map(source => source.raw).join('');

    return new StringBuffer(rawString, {
      raw: rawString,
      start: bufferOrCharSources[0].start,
      end: bufferOrCharSources[bufferOrCharSources.length - 1].end,
    });
  }

  public bufferOrChar(cst: CstChildrenDictionary): ISource {
    return Optional.ofNullable(cst.buffer)
      .or(() => Optional.ofNullable(cst.char))
      .map(elements => elements.filter(isIToken)[0])
      .map(tokenToSource)
      .orElseThrow(() => new Error('expected char or buffer'));
  }

  // todo: if key !== closingDustTag key we should throw a parse error
  public section(cst: CstChildrenDictionary) {
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
    const rawClosingToken = maybeSelfClosingDustTag.map(_ => '/}').orElse('}');
    const rawClosingTag = maybeSelfClosingDustTag
      .map(_ => '')
      .orElse(`{/${key.source.raw}}`);
    const rawParams = params.map(param => param.source.raw).join('\n');
    const rawContext = Optional.ofNullable(context)
      .map(ctx => ctx.source.raw)
      .orElse('');
    const rawMainBody = Optional.ofNullable(mainBody)
      .map(body => body.source.raw)
      .orElse('');
    const rawBodies = otherBodies
      .map(body => `\n{:${body.context}\n${body.source.raw}`)
      .join('');
    const rawSection = `{${dustSectionCharacterPrefix}${
      key.source.raw
    }${rawContext} ${rawParams}${rawClosingToken}${rawMainBody}${rawBodies}${rawClosingTag}`;

    return new Section(
      dustSectionCharacterPrefix,
      key,
      context,
      params,
      allBodies,
      maybeSelfClosingDustTag.isPresent,
      {
        raw: rawSection,
        start: startPosition,
        end: endPosition,
      },
    );
  }

  public params(cst: CstChildrenDictionary): IParam[] {
    return Optional.ofNullable(cst.param)
      .map(params => params.filter(isCstNode))
      .map(params => params.map(param => this.visit(param)))
      .orElseGet(() => []);
  }

  public param(cst: CstChildrenDictionary): IParam {
    const key = cst.key.filter(isIToken)[0];
    const value: ParamValue = Optional.ofNullable(cst.number)
      .or(() => Optional.ofNullable(cst.identifier))
      .or(() => Optional.ofNullable(cst.$inlineStringParamValue))
      .map(elements => elements.filter(isCstNode)[0])
      .map(node => this.visit(node))
      .orElseThrow(
        () => new Error('expected number, identifier, or inline string param'),
      );

    return new Param(key.image, value, {
      raw: `${key.image}=${value.source.raw}`,
      start: tokenToStartPosition(key),
      end: value.source.end,
    });
  }

  public param$inlineStringParamValue(
    cst: CstChildrenDictionary,
  ): IQuotedDustValue {
    return this.visit(cst.inlineWithoutStartQuote[0] as CstNode);
  }

  public reference(cst: CstChildrenDictionary): IReference {
    const path: IPath = this.visit(cst.identifier.filter(isCstNode)[0]);
    const filters: IFilter[] = this.visit(cst.filters.filter(isCstNode)[0]);
    const startBrace = cst.dustStart.filter(isIToken)[0];
    const endBrace = cst.closingDustTagEnd.filter(isIToken)[0];

    return new Reference(path, filters, {
      raw: `{${path.source.raw}${filters
        .map(filter => filter.source.raw)
        .join('')}`,
      start: tokenToStartPosition(startBrace),
      end: tokenToEndPosition(endBrace),
    });
  }

  public filters(cst: CstChildrenDictionary): IFilter[] {
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

  public selfClosingBlock(cst: CstChildrenDictionary) {
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
    const rawParams = params.map(param => param.source.raw).join('\n');
    const rawContext = Optional.ofNullable(context)
      .map(ctx => ctx.source.raw)
      .orElse('');
    const rawSection = `{${dustSectionCharacterPrefix}${
      key.image
    }${rawContext} ${rawParams} /}`;

    return new Section(
      dustSectionCharacterPrefix,
      new Path(key.image, tokenToSource(key)),
      context,
      params,
      [],
      true,
      {
        raw: rawSection,
        start: startPosition,
        end: endPosition,
      },
    );
  }

  public partial(cst: CstChildrenDictionary): ISection {
    const dustSectionCharacterPrefix = (Object.values(
      (cst.dustSectionCharacterPrefix[0] as CstNode).children,
    )[0][0] as IToken).image;
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
    const rawParams = params.map(param => param.source.raw).join('\n');
    const rawContext = Optional.ofNullable(context)
      .map(ctx => ctx.source.raw)
      .orElse('');
    const rawSection = `{${dustSectionCharacterPrefix}${
      key.image
    }${rawContext} ${rawParams} /}`;

    return new Section(
      dustSectionCharacterPrefix,
      new Path(key.image, tokenToSource(key)),
      context,
      params,
      [],
      true,
      {
        raw: rawSection,
        start: startPosition,
        end: endPosition,
      },
    );
  }

  public inlineWithoutStartQuote(cst: CstChildrenDictionary): IQuotedDustValue {
    const maybeInlines = Optional.ofNullable(cst.inline)
      .map(inlineNodes => inlineNodes.filter(isCstNode))
      .map(
        (inlineNodes): Inline[] => inlineNodes.map(node => this.visit(node)),
      );
    const inlines = maybeInlines.orElseGet(() => []);
    const rawInlines = inlines.map(inline => inline.source.raw).join('');
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
      raw: `"${rawInlines}"`,
      start: startPositionWithStartQuote,
      end: endPosition,
    });
  }

  public inline(cst: CstChildrenDictionary): Inline {
    return Optional.ofNullable(cst.special)
      .or(() => Optional.ofNullable(cst.reference))
      .map(elements => elements.filter(isCstNode)[0])
      .map(node => this.visit(node))
      .orElseGet(
        (): IEscapedQuote | IStringBuffer => {
          const maybeEscapedQuote: Optional<
            IEscapedQuote | IStringBuffer
          > = Optional.of(cst.escapedQuote)
            .map(elements => elements.filter(isIToken)[0])
            .map(token => new EscapedQuote(token.image, tokenToSource(token)));
          const maybeStringBuffer = Optional.of(cst.dustQuoteBuffer)
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

  public special(cst: CstChildrenDictionary): ISpecial {
    const key = cst.key.filter(isIToken)[0];
    const dustStart = cst.dustStart.filter(isIToken)[0];
    const closingDustTagEnd = cst.closingDustTagEnd.filter(isIToken)[0];

    return new Special(key.image, {
      raw: `{~${key.image}`,
      start: tokenToStartPosition(dustStart),
      end: tokenToEndPosition(closingDustTagEnd),
    });
  }

  public number(cst: CstChildrenDictionary): INumber {
    const numberToken: IToken = Object.values(cst)[0][0] as IToken;

    return new NumberNode(+numberToken.image, tokenToSource(numberToken));
  }

  public contextBody(cst: CstChildrenDictionary): IBody {
    const root: IRoot = this.visit(cst.body.filter(isCstNode)[0]);
    const contextToken = cst.dustContext.filter(isIToken)[0];
    const contextKey = Optional.ofNullable(contextToken.image.match(/{:([^}]+)}/))
      .map(match => match[1])
      .orElseThrow(() => new Error('error parsing dustContext token key: context key not found'));
    const context = new Context(new Path(contextKey, tokenToSource(contextToken)), tokenToSource(contextToken));

    return new Body(context, root, {
      raw: `${context.source.raw}\n${root.source.raw}`,
      start: tokenToStartPosition(contextToken),
      end: root.source.end,
    });
  }

  public context(cst: CstChildrenDictionary): IContext | null {
    return Optional.ofNullable(cst.colon)
      .map(colons => {
        const colonToken = colons.filter(isIToken)[0];
        const path: Path = this.visit(cst.path[0] as CstNode);

        return new Context(path, {
          raw: `:${path.source.raw}`,
          start: tokenToStartPosition(colonToken),
          end: path.source.end,
        });
      })
      .orNull();
  }

  public identifier(cst: CstChildrenDictionary): Path {
    if (cst.key) {
      const keyToken = cst.key[0] as IToken;
      return new Path(keyToken.image, tokenToSource(keyToken));
    }

    return this.visit(cst.path[0] as CstNode);
  }

  public path(cst: CstChildrenDictionary) {
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
                raw: `.${rawArrays}`,
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

  public array(cst: CstChildrenDictionary): ISource {
    const rawInner = Optional.ofNullable(cst.identifier)
      .map(identifierNodes => this.visit(identifierNodes[0] as CstNode))
      .orElseGet(() => (cst.unsignedInteger[0] as IToken).image);
    const maybeArrayPartSource: Optional<ISource> = Optional.ofNullable(
      cst.arrayPart,
    ).map(arrayPartNodes => this.visit(arrayPartNodes[0] as CstNode));
    const rawArrayPart = maybeArrayPartSource
      .map(arrayPart => arrayPart.raw)
      .orElse('');
    const endPosition = maybeArrayPartSource
      .map(source => source.end)
      .orElseGet(() => tokenToEndPosition(cst.rb[0] as IToken));

    return {
      raw: `[${rawInner}]${rawArrayPart}`,
      start: tokenToStartPosition(cst.lb[0] as IToken),
      end: endPosition,
    };
  }

  public arrayPart(cst: CstChildrenDictionary): ISource {
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

    return {
      raw: `.${keys}${rawArray}`,
      start: tokenToStartPosition(cst.dot[0] as IToken),
      end: endPosition,
    };
  }

  public commentRule(cst: CstChildrenDictionary) {
    return Optional.ofNullable(cst.comment[0])
      .filter(isIToken)
      .map(token => new DustComment(tokenToSource(token as IToken)))
      .orElseThrow(
        () => new Error(`Expected comment token, received: ${cst.comment[0]}`),
      );
  }

  public rawRule(cst: CstChildrenDictionary) {
    const rawNode = cst.raw[0];

    if (isIToken(rawNode)) {
      return new Raw(tokenToSource(rawNode));
    } else {
      throw new Error(`Expected comment token, received: ${rawNode}`);
    }
  }
}

export const toAstVisitorInstance = new DustHtmlVisitor();

export function toAst(inputText: string) {
  const cst = parse(inputText);

  return toAstVisitorInstance.visit(cst);
}
