# @blog/eslint-config

项目公共 Eslint 配置

## 用法

在项目的`eslint.config.mjs`文件中设置：

```js
export { default } from '@blog/eslint-config';
```

## 说明

此配置适用于`eslint@10`。

对象字面量、对象解构（包含函数参数）、数组字面量、数组解构和 JSX 属性超过三项时，每项独占一行。三项以内允许保持一行，也可以主动换行。对象 / 数组的展开项及解构剩余项、JSX 的展开属性均计入数量；嵌套结构分别计数。

对象与数组的括号也换行；多行 JSX 的第一个属性从下一行开始。对象属性换行通过本包的 `blog/object-property-newline` 规则补齐阈值和对象解构支持，其他部分使用 Stylistic 规则。所有规则支持自动修复。

命名导入 `import { ... }` 和命名导出 `export { ... }` 中超过三项，或者已写成多行时，每项独占一行，花括号也单独换行。三项以内的单行写法可以保留；`type` 导入和别名各计为一项，花括号外的默认导入不计入数量。括号换行使用 Stylistic 规则，逐项换行由 `blog/named-specifier-newline` 补齐，均支持自动修复。

`if`、`else` 以及循环语句的主体必须使用花括号（`curly: all`），单条语句也不能省略。`if` 与前后相邻语句之间必须留空行，连续的 `if` 之间也一样；语句块开头和结尾不额外添加空行。`else if` 和 `else` 保持为完整条件链，关键词前后保留空格。这些规则同样支持自动修复。

在仓库根目录执行 `pnpm lint:fix` 修复全项目，执行 `pnpm lint` 检查全项目。规则边界与修复稳定性测试使用 `pnpm --filter @blog/eslint-config test`。

各子包的 `lint` 和 `lint:fix` 都配置 `--no-error-on-unmatched-pattern --no-quiet --max-warnings=0`，显示警告并要求警告数量为零。根目录脚本只负责递归调用，不再追加 ESLint 参数，因此从根目录批量执行与在子包内单独执行采用相同的检查要求。
