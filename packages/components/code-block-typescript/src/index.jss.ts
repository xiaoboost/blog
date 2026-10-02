import {
  CodeText,
  CodeSyntaxComment,
  CodeSyntaxKeyword,
  CodeSyntaxFunction,
  CodeSyntaxString,
  CodeSyntaxNumber,
  CodeSyntaxType,
  CodeSyntaxProperty,
  CodeSyntaxOperator,
} from '@blog/mdx-code-block-normal/theme';
import { createStyles, FontCode, DurationNormal, DurationFast, FontSizeSm } from '@blog/styles/compile';
import { lsInfoAttrName } from './constant';
import {
  LspInfoBg,
  LspInfoText,
  LspInfoBorder,
  LspInfoShadow,
  LspInfoTypeBorder,
  LspErrorBg,
  LspErrorBorder,
  LspErrorBgHover,
} from './theme/token';

const errorUnderlineSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3" viewBox="0 0 6 3">'
  + '<g fill="#c94824">'
  + '<polygon points="5.5,0 2.5,3 1.1,3 4.1,0"/>'
  + '<polygon points="4,0 6,2 6,0.6 5.4,0"/>'
  + '<polygon points="0,2 1,3 2.4,3 0,0.6"/>'
  + '</g></svg>';

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
  lspError: {},
  lspErrorStartLine: {},
  lspErrorEndLine: {},
  lspErrorLineHighlight: {},
  lspErrorToken: {},
  lspErrorGoto: {},
  codeBlockLs: {
    [`&:hover [${lsInfoAttrName}]`]: {
      borderColor: LspInfoTypeBorder,
    },
    [`& [${lsInfoAttrName}]`]: {
      borderBottom: '1px dotted transparent',
      transitionTimingFunction: 'ease',
      transition: `border-color ${DurationNormal}`,
    },
    '& $lspErrorToken': {
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(errorUnderlineSvg)}")`,
      backgroundAttachment: 'scroll',
      backgroundClip: 'border-box',
      backgroundOrigin: 'padding-box',
      backgroundPositionX: 0,
      backgroundPositionY: '100%',
      backgroundRepeat: 'repeat-x',
      backgroundSize: 'auto',
    },
    '& $lspErrorStartLine': {
      paddingTop: '0.2em !important',
      marginTop: '0.2em !important',
    },
    '& $lspErrorEndLine': {
      paddingBottom: '0.2em !important',
      marginBottom: '0.2em !important',
    },
    '& $lspError': {
      backgroundColor: LspErrorBg,
      borderLeft: `2px solid ${LspErrorBorder}`,
      transition: `background-color ${DurationFast} ease`,

      '&$lspErrorLineHighlight': {
        backgroundColor: LspErrorBgHover,
      },
    },

    '& [class*="lsp-keyword"], & [class*="lsp-storage-type"], & [class*="lsp-storage-modifier"]': {
      color: CodeSyntaxKeyword,
    },
    '& [class*="lsp-keyword-operator"]': {
      color: CodeSyntaxOperator,
    },
    '& [class*="lsp-string-quoted"]': {
      color: CodeSyntaxString,
    },
    '& [class*="lsp-comment"]': {
      color: CodeSyntaxComment,
      fontStyle: 'italic',
    },
    '& [class*="lsp-support-type"]': {
      color: CodeSyntaxOperator,
    },
    [addTsxSelector('& .lsp-constant-numeric-decimal')]: {
      color: CodeSyntaxNumber,
    },
    [addTsxSelector('& .lsp-storage-type-numeric-bigint')]: {
      color: CodeSyntaxKeyword,
    },

    // import 语句
    [addTsxSelector(`
      & .lsp-meta-import.lsp-constant-language-import-export-all,
      & .lsp-meta-import.lsp-variable-other-readwrite-alias,
    `)]: {
      color: CodeSyntaxProperty,
    },

    // interface 语句
    [addTsxSelector('& .lsp-meta-interface')]: {
      [addTsxSelector('&.lsp-storage-modifier')]: {
        color: CodeSyntaxKeyword,
      },
      [addTsxSelector(`
        &.lsp-entity-name-type-interface,
        &.lsp-entity-other-inherited-class,
        &.lsp-entity-name-type
      `)]: {
        color: CodeSyntaxType,
        fontWeight: 'bold',
      },
      [addTsxSelector('&.lsp-entity-name-type-module')]: {
        color: CodeSyntaxProperty,
      },
      [addTsxSelector('&.lsp-meta-definition-method.lsp-entity-name-function')]: {
        color: CodeSyntaxFunction,
      },
      [`
        &.lsp-punctuation-definition-parameters-begin,
        &.lsp-punctuation-definition-parameters-end
      `.trim()]: {
        color: CodeSyntaxKeyword,
      },
    },

    // function 语句
    [addTsxSelector('& .lsp-meta-function, & .lsp-meta-function-expression')]: {
      [addTsxSelector('&.lsp-meta-definition-function.lsp-entity-name-function')]: {
        color: CodeSyntaxFunction,
      },
      [addTsxSelector('&.lsp-entity-name-type-module')]: {
        color: CodeSyntaxProperty,
      },
      [addTsxSelector('&.lsp-entity-name-type')]: {
        color: CodeSyntaxType,
      },
      [addTsxSelector('&.lsp-meta-type-function-return')]: {
        color: CodeSyntaxKeyword,
      },
    },

    // 对象字面量
    [addTsxSelector('& .lsp-meta-objectliteral')]: {
      [`
        &.lsp-meta-object-literal-key,
        &.lsp-variable-other-property,
        &.lsp-variable-other-object-property`.trim()]: {
        color: CodeSyntaxProperty,
      },
    },

    // 数组字面量
    [addTsxSelector('& .lsp-meta-array-literal')]: {
      [addTsxSelector('&.lsp-meta-brace-square')]: {
        color: CodeSyntaxOperator,
      },
    },

    // 变量/常量声明
    [addTsxSelector('& .lsp-meta-var-expr')]: {
      [addTsxSelector('&.lsp-meta-type-annotation')]: {
        [addTsxSelector('&.lsp-entity-name-type')]: {
          color: CodeSyntaxNumber,
          fontWeight: 'bold',
        },
      },
      [addTsxSelector('&.lsp-variable-other-constant')]: {
        color: CodeSyntaxType,
      },
    },

    // 模板字符串
    [addTsxSelector('& .lsp-string-template')]: {
      color: CodeSyntaxString,

      [`
        &.lsp-punctuation-definition-template-expression-begin,
        &.lsp-punctuation-definition-template-expression-end`.trim()]: {
        color: CodeSyntaxProperty,
      },
    },

    // 正则表达式
    [addTsxSelector('& .lsp-string-regexp')]: {
      color: CodeSyntaxOperator,
    },

    // tsx 标签
    [addTsxSelector('& .lsp-entity-name-tag')]: {
      color: CodeSyntaxFunction,
    },
    // tsx 标签属性
    [addTsxSelector('& .lsp-entity-other-attribute-name')]: {
      color: CodeSyntaxNumber,
    },

    [`
      & .lsp-constant-language-boolean-false,
      & .lsp-constant-language-boolean-true`.trim()]: {
      color: CodeSyntaxNumber,
    },

    [addTsxSelector('& .lsp-meta-function-call')]: {
      color: CodeSyntaxFunction,

      [addTsxSelector('&.lsp-variable-other-object')]: {
        color: CodeText,
      },
    },

    [`
      & .lsp-support-variable-property-dom,
      & .lsp-support-variable-property,
      & .lsp-variable-other-property`.trim()]: {
      color: CodeSyntaxProperty,
    },

    [`
      & .lsp-support-class-console,
      & .lsp-support-constant-math`.trim()]: {
      color: `${CodeSyntaxNumber} !important`,
    },
  },
  lsInfoBox: {
    position: 'fixed',
    fontSize: FontSizeSm,
    fontFamily: FontCode,
    transform: 'translateY(14px)',
    color: LspInfoText,
    border: `1px solid ${LspInfoBorder}`,
    backgroundColor: LspInfoBg,
    lineHeight: '1.5em',
    padding: '4px 6px',
    boxShadow: LspInfoShadow,

    '& pre': {
      margin: 0,
      fontFamily: 'inherit',
      whiteSpace: 'pre-wrap',
    },
    '& .keyword': {
      color: CodeSyntaxKeyword,
    },
    '& .operator': {
      color: CodeSyntaxOperator,
    },
    '& .numericLiteral, & .localName': {
      color: CodeSyntaxNumber,
    },
    '& .stringLiteral, & .aliasName': {
      color: CodeSyntaxString,
    },
    '& .className, & .interfaceName': {
      color: CodeSyntaxType,
    },
    '& .functionName': {
      color: CodeSyntaxFunction,
    },
    '& .methodName': {
      color: CodeSyntaxFunction,
    },
    '& .propertyName, & .enumName, & .enumMemberName': {
      color: CodeSyntaxProperty,
    },
  },
});
