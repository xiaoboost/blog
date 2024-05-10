---
title: 静态代码错误提示
create: 2024/05/08
description: TypeScript 官网逆向工程其之二——代码框的错误提示功能。
tags:
  - 前端技术
  - 语言服务
---

在之前的[类型提示](../code-quick-info/index.mdx)文章中，我逆向了基本的类型提示功能，五一期间我又闲着无聊，又逆向了*错误提示*功能。下面是基本功能展示，基于个人的喜好问题，样式调整的比较~花里胡哨~，希望大伙见谅。

# 功能展示

```ts
interface Point {
  pointX: number;
}

const point1: Point = 123n + 123;

const point2 = point3 + point4;

const point5: Point = {
  pointX: '123',
};
```

# 原理讲解

其实整体功能还是从之前的语言服务延申出来的，能说的内容不多，~我只是想水篇博文~。

## 获取错误数据

语言服务的初始化等内容请看[类型提示](../code-quick-info/index.mdx)，错误数据毫无疑问也是从语言服务中拿出来的，这里我们需要使用另外的几个接口来拿数据。

```ts
import * as ts from 'typescript';

/** 需要检查的文件路径 */
declare const filePath: string;
/** 语言服务 */
declare const server: ts.LanguageService;

const program = server.getProgram();
const sourceFile = program?.getSourceFile(filePath);
const rawScriptDiagnostics = [
  // 语法诊断
  ...(program?.getSyntacticDiagnostics(sourceFile) ?? []),
  // 语义诊断
  ...(program?.getSemanticDiagnostics(sourceFile) ?? []),
  // 声明诊断
  ...(program?.getDeclarationDiagnostics(sourceFile) ?? []),
];
```

最后得到的`rawScriptDiagnostics`数组即是当前文件的所有错误数据，诊断数据的类型还是很清晰的，都能望文生义。

```ts
import * as ts from 'typescript';

enum DiagnosticCategory {
  Warning,
  Error,
  Suggestion,
  Message,
}

interface DiagnosticWithLocation {
  category: DiagnosticCategory;
  code: number;
  file: ts.SourceFile;
  start: number;
  length: number;
  messageText: string | ts.DiagnosticMessageChain;
}
```

## 格式化错误文本

上面的数据结构只有一项是比较麻烦的，那就是`messageText`数据，我们可以看到它可以是字符串，也可以是`DiagnosticMessageChain`接口，后者接口对应的是多行错误。

```ts
function transform(input: string | number) {
  return input.toLowerCase();
}
```

这个例子中我们可以看到，`input.toLowerCase()`方法的错误信息有两行，这是因为类型诊断数据是由*Token*定义由内向外的，这样更能展示出完整的信息，方便编码者判断错误内容。
在类似多行的错误时，`messageText`属性就会是`DiagnosticMessageChain`接口，可以来看看它的结构——

```ts
enum DiagnosticCategory {
  Warning,
  Error,
  Suggestion,
  Message,
}

interface DiagnosticMessageChain {
  messageText: string;
  category: DiagnosticCategory;
  code: number;
  next?: DiagnosticMessageChain[];
}
```

`DiagnosticMessageChain`接口就像是链表一样，使用`next`属性将所有错误都串联了起来，而且每个数据还可以链接多个数据，这个结构着实有点复杂，如果是我们自己手写`formatter`的话，需要费一番功夫。然而这其实不用担心！其实 TS 也是考虑了这点的，官方有提供格式化的方法——

```ts
import * as ts from 'typescript';

declare const rawScriptDiagnostics: ts.Diagnostic[];
const host: ts.FormatDiagnosticsHost = { /*** hl ***/
  getCurrentDirectory: () => '/',
  getCanonicalFileName: () => '',
  getNewLine: () => '\n',
};

/** 格式化的错误文本 */
const diagnosticsFormatted = rawScriptDiagnostics.map((data) => {
  return ts.formatDiagnostic(data, host); /*** hl ***/
});
```

第`4`和`12`行的高亮就是这个格式化方法的用法，这里仍然需要个格式化方法的`Host`实体，不过内容并不多，只需要提供*换行*、*文件名格式化方法*、*当前工作路径*三个参数即可，可以按照自己语言服务的情况来提供。

## 详细错误解释

很多时候，我们即便是看了具体的错误仍然不知道这错误是啥意思……TS 官网也没给每个错误的对应表。于是我找了个[开源网站](https://typescript.tv/errors/)，对每个`Error Code`做了个跳转，每个错误文本开头的`[TS数字]`符号都是可以直接点击跳转到对应的错误解释，还是很方便的。
