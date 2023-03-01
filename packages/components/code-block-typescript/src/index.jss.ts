import { createStyles, Color, FontMono, Gray, GrayLight } from '@blog/styles';
import { lsInfoAttrName } from './constant';

const Black = Color(0x383a42);
const Blue = Color(0x4078f2);
const LighterBlue = Color(0x87cefa);
const Green = Color(0x50a155);
const Red = Color(0xe4564f);
const LightBrown = Color(0xc18401);
const Brown = Color(0x986801);
const Violet = Color(0xa626a4);
const LightViolet = Color(0xda70d6);

function addTsxSelector(selector: string) {
  const selectorList = selector
    .trim()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const len = selectorList.length;

  for (let i = 0; i < len; i++) {
    selectorList.push(selectorList[i].replace(/\.([a-zA-Z0-9-]+)/g, '.$1x'));
  }

  return selectorList.join(',');
}

export default createStyles({
  codeBlockLs: {
    [`&:hover [${lsInfoAttrName}]`]: {
      borderColor: '#747474',
    },
    [`& [${lsInfoAttrName}]`]: {
      borderBottom: '1px dotted transparent',
      transitionTimingFunction: 'ease',
      transition: 'border-color .3s',
    },

    '& [class*="lsp-keyword"], & [class*="lsp-storage-type"], & [class*="lsp-storage-modifier"]': {
      color: Violet.toString(),
    },
    '& [class*="lsp-keyword-operator"]': {
      color: '#0184BC',
    },
    '& [class*="lsp-string-quoted"]': {
      color: Green.toString(),
    },
    '& [class*="lsp-comment"]': {
      color: '#A0A1A7',
      fontStyle: 'italic',
    },
    '& [class*="lsp-support-type"]': {
      color: '#0184BC',
    },
    [addTsxSelector('& .lsp-constant-numeric-decimal')]: {
      color: Brown.toString(),
    },

    // import 语句
    [addTsxSelector(`
      & .lsp-meta-import.lsp-constant-language-import-export-all,
      & .lsp-meta-import.lsp-variable-other-readwrite-alias,
    `)]: {
      color: Red.toString(),
    },

    // interface 语句
    [addTsxSelector('& .lsp-meta-interface')]: {
      [addTsxSelector('&.lsp-storage-modifier')]: {
        color: Violet.toString(),
      },
      [addTsxSelector(`
        &.lsp-entity-name-type-interface,
        &.lsp-entity-other-inherited-class,
        &.lsp-entity-name-type
      `)]: {
        color: LightBrown.toString(),
      },
      [addTsxSelector('&.lsp-entity-name-type-module')]: {
        color: Red.toString(),
      },
      [addTsxSelector('&.lsp-meta-definition-method.lsp-entity-name-function')]: {
        color: Blue.toString(),
      },
      [`
        &.lsp-punctuation-definition-parameters-begin,
        &.lsp-punctuation-definition-parameters-end
      `.trim()]: {
        color: LightViolet.toString(),
      },
    },

    // function 语句
    [addTsxSelector('& .lsp-meta-function, & .lsp-meta-function-expression')]: {
      [addTsxSelector('&.lsp-meta-definition-function.lsp-entity-name-function')]: {
        color: Blue.toString(),
      },
      [addTsxSelector('&.lsp-entity-name-type-module')]: {
        color: Red.toString(),
      },
      [addTsxSelector('&.lsp-entity-name-type')]: {
        color: LightBrown.toString(),
      },
      [addTsxSelector('&.lsp-meta-type-function-return')]: {
        color: Violet.toString(),
      },
    },

    // 对象字面量
    [addTsxSelector('& .lsp-meta-objectliteral')]: {
      [`
        &.lsp-meta-object-literal-key,
        &.lsp-variable-other-property,
        &.lsp-variable-other-object-property`.trim()]: {
        color: Red.toString(),
      },
    },

    // 数组字面量
    [addTsxSelector('& .lsp-meta-array-literal')]: {
      [addTsxSelector('&.lsp-meta-brace-square')]: {
        color: LighterBlue.toString(),
      },
    },

    // 变量/常量声明
    [addTsxSelector('& .lsp-meta-var-expr')]: {
      [addTsxSelector('&.lsp-meta-type-annotation')]: {
        [addTsxSelector('&.lsp-entity-name-type')]: {
          color: Brown.toString(),
        },
      },
      [addTsxSelector('&.lsp-variable-other-constant')]: {
        color: LightBrown.toString(),
      },
    },

    // 模板字符串
    [addTsxSelector('& .lsp-string-template')]: {
      color: Green.toString(),

      [`
        &.lsp-punctuation-definition-template-expression-begin,
        &.lsp-punctuation-definition-template-expression-end`.trim()]: {
        color: '#CA1243',
      },
    },

    // 正则表达式
    [addTsxSelector('& .lsp-string-regexp')]: {
      color: '#0184C4',
    },

    // tsx 标签
    [addTsxSelector('& .lsp-entity-name-tag')]: {
      color: Blue.toString(),
    },
    // tsx 标签属性
    [addTsxSelector('& .lsp-entity-other-attribute-name')]: {
      color: Brown.toString(),
    },

    [`
      & .lsp-constant-language-boolean-false,
      & .lsp-constant-language-boolean-true`.trim()]: {
      color: Brown.toString(),
    },

    [addTsxSelector('& .lsp-meta-function-call')]: {
      color: Blue.toString(),

      [addTsxSelector('&.lsp-variable-other-object')]: {
        color: Black.toString(),
      },
    },

    [`
      & .lsp-support-variable-property-dom,
      & .lsp-support-variable-property,
      & .lsp-variable-other-property`.trim()]: {
      color: Red.toString(),
    },

    [`
      & .lsp-support-class-console,
      & .lsp-support-constant-math`.trim()]: {
      color: `${Brown.toString()} !important`,
    },
  },
  lsInfoBox: {
    position: 'fixed',
    fontSize: 12,
    fontFamily: FontMono,
    transform: 'translateY(14px)',
    color: Black.toString(),
    border: `1px solid ${Gray.toString()}`,
    backgroundColor: GrayLight.toString(),
    lineHeight: '1.5em',
    padding: '4px 6px',
    boxShadow: '0 0 6px rgb(0 0 0 / 20%)',

    '& pre': {
      margin: 0,
      whiteSpace: 'pre-wrap',
    },
    '& .keyword': {
      color: '#A626A4',
    },
    '& .operator': {
      color: '#0184BC',
    },
    '& .numericLiteral, & .localName': {
      color: Brown.toString(),
    },
    '& .stringLiteral, & .aliasName': {
      color: '#50A14F',
    },
    '& .className, & .interfaceName': {
      color: '#C98401',
    },
    '& .functionName': {
      color: '#4078F2',
    },
    '& .methodName': {
      color: '#4078F2',
    },
    '& .propertyName, & .enumName, & .enumMemberName': {
      color: '#E45649',
    },
  },
});
