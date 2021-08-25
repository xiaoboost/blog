import { createStyles, Color, FontMono, GrayLight } from '@blog/styles';
import { lspInfoAttrName } from './constant';

const Black = Color(0x383A42);
const Blue = Color(0x4078F2);
const LighterBlue = Color(0x87CEFA);
const Green = Color(0x50A155);
const Red = Color(0xE4564F);
const LightBrown = Color(0xC18401);
const Brown = Color(0x986801);
const Violet = Color(0xA626A4);
const LightViolet = Color(0xDA70D6);

export default createStyles({
  codeBlockLsp: {
    [`&:hover [${lspInfoAttrName}]`]: {
      borderColor: '#747474',
    },
    [`& [${lspInfoAttrName}]`]: {
      borderBottom: '1px dotted transparent',
      transitionTimingFunction: 'ease',
      transition: 'border-color .3s',
    },

    // [class*="lsp-keyword"],
    // [class*="lsp-storage-type"] {
    //   color: Violet;
    // }

    // [class*="lsp-keyword-operator"] {
    //   color: #0184BC;
    // }

    // [class*="lsp-string-quoted"] {
    //   color: Green;
    // }

    // [class*="lsp-comment"] {
    //   color: #A0A1A7;
    //   font-style: italic;
    // }

    // [class*="lsp-support-type"] {
    //   color: #0184BC;
    // }

    // .lsp-constant-numeric-decimal {
    //   color: Brown;
    // }

    // // import 语句
    // .lsp-meta-import {
    //   &.lsp-constant-language-import-export-all,
    //   &.lsp-variable-other-readwrite-alias {
    //     color:Red
    //   }
    // }

    // // interface 语句
    // .lsp-meta-interface {
    //   &.lsp-storage-modifier {
    //     color: Violet;
    //   }
    //   &.lsp-entity-name-type-interface,
    //   &.lsp-entity-other-inherited-class,
    //   &.lsp-entity-name-type {
    //     color: LightBrown;
    //   }
    //   &.lsp-entity-name-type-module {
    //     color:Red
    //   }
    //   &.lsp-meta-definition-method.lsp-entity-name-function {
    //     color: Blue;
    //   }
    //   &.lsp-punctuation-definition-parameters-begin,
    //   &.lsp-punctuation-definition-parameters-end {
    //     color: LightViolet;
    //   }
    // }

    // // function 语句
    // .lsp-meta-function {
    //   &.lsp-meta-definition-function.lsp-entity-name-function {
    //     color: Blue;
    //   }
    //   &.lsp-entity-name-type-module {
    //     color:Red
    //   }
    //   &.lsp-entity-name-type {
    //     color: LightBrown;
    //   }
    //   // &.lsp-meta-type-function-return {
    //   //   color: Violet;
    //   // }
    // }

    // // 对象字面量
    // .lsp-meta-objectliteral {
    //   &.lsp-meta-object-literal-key,
    //   &.lsp-variable-other-property,
    //   &.lsp-variable-other-object-property {
    //     color: Red;
    //   }
    // }

    // // 数组字面量
    // .lsp-meta-array-literal {
    //   &.lsp-meta-brace-square {
    //     color: LighterBlue;
    //   }
    // }

    // // 变量/常量声明
    // .lsp-meta-var-expr {
    //   &.lsp-meta-type-annotation {
    //     &.lsp-entity-name-type {
    //       color: Brown;
    //     }
    //   }
    //   &.lsp-variable-other-constant {
    //     color: LightBrown;
    //   }
    // }

    // // 模板字符串
    // .lsp-string-template {
    //   color: Green;

    //   &.lsp-punctuation-definition-template-expression-begin,
    //   &.lsp-punctuation-definition-template-expression-end {
    //     color: #CA1243;
    //   }
    // }

    // // 正则表达式
    // .lsp-string-regexp {
    //   color: #0184C4;
    // }

    // .lsp-constant-language-boolean-false,
    // .lsp-constant-language-boolean-true {
    //   color: Brown;
    // }

    // .lsp-meta-function-call {
    //   color: Blue;

    //   &.lsp-variable-other-object {
    //     color: Black;
    //   }
    // }

    // .lsp-support-variable-property-dom,
    // .lsp-support-variable-property,
    // .lsp-variable-other-property {
    //   color: Red;
    // }

    // .lsp-support-class-console,
    // .lsp-support-constant-math {
    //   color: Brown !important;
    // }
  },
  lspInfoBox: {
    position: 'fixed',
    fontSize: 12,
    fontFamily: FontMono,
    transform: 'translateY(14px)',
    color: Black.toString(),
    border: '1px solid Gray',
    backgroundColor: GrayLight.toString(),
    lineHeight: '1.5em',
    padding: '4px 6px',

    '& pre': {
      margin: 0,
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
