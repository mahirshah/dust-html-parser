import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { parse, parserInstance } from '../parse';
import {
  cstElementToSource,
  elementPositionComparator,
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
  IEscapedQuote,
  Inline,
  INode,
  IQuotedDustValue,
  IReference,
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

// todo: switch back to non default constructor
const BaseDustHtmlVisitor = parserInstance.getBaseCstVisitorConstructorWithDefaults();

class DustHtmlVisitor extends BaseDustHtmlVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  public body(cst: CstChildrenDictionary) {
    const parts = cst.part
      .filter(isCstNode)
      .map((part): INode => this.visit(part));

    // todo: fix the source
    return new Root(cstElementToSource(cst.part[0]), parts);
  }

  public part(cst: CstChildrenDictionary) {
    const alternationValue = Object.values(cst)[0];

    if (alternationValue.length !== 1) {
      throw new Error(
        `expected part to contain 1 alternation subrule, but received ${alternationValue}`,
      );
    }

    const alternationNode = alternationValue[0];
    if (isCstNode(alternationNode)) {
      return this.visit(alternationNode);
    } else {
      // todo: implement $buffer
      throw Error('implement me');
    }
  }

  // todo: if key !== closingDustTag key we should throw a parse error
  public section(cst: CstChildrenDictionary) {
    const dustSectionCharacterPrefix = (Object.values(
      (cst.dustSectionCharacterPrefix[0] as CstNode).children,
    )[0][0] as IToken).image;
    const key = this.visit(cst.identifier[0] as CstNode);
    const context = this.visit(cst.context[0] as CstNode);
    const params = this.visit(cst.params[0] as CstNode);
    const maybeSelfClosingDustTag = Optional.ofNullable(
      cst.selfClosingDustTagEnd,
    );
    const maybeBodies = Optional.ofNullable(cst.body)
      .map(bodies => bodies.filter(isCstNode))
      .map(bodies => bodies.map(body => this.visit(body)));
    const mainBody = maybeBodies.map(bodies => bodies[0]).orNull();
    const elseBody = maybeBodies.map(bodies => bodies[1]).orNull();
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
      mainBody,
      elseBody,
      maybeSelfClosingDustTag.isPresent,
      {
        raw: ``,
        start: startPosition,
        end: endPosition,
      },
    );
  }

  public params(cst: CstChildrenDictionary): Param[] {
    return Optional.ofNullable(cst.param)
      .map(params => params.filter(isCstNode))
      .map(params => params.map(param => this.visit(param)))
      .orElseGet(() => []);
  }

  public param(cst: CstChildrenDictionary): Param {
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

  public $inlineStringParamValue(cst: CstChildrenDictionary): IQuotedDustValue {
    return this.visit(cst.inlineWithoutStartQuote[0] as CstNode);
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

  public number(cst: CstChildrenDictionary) {
    const numberToken: IToken = Object.values(cst)[0][0] as IToken;

    return new NumberNode(+numberToken.image, tokenToSource(numberToken));
  }

  public context(cst: CstChildrenDictionary): Context | null {
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
