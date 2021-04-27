---
title: 静态代码提示
create: 2021/03/22
description: TypeScript 官网不知道啥时候上线了静态代码提示功能，看着觉得非常不错，于是准备在博客里也做一个。
---

所谓“静态代码提示”，是指在没有语言服务的情况下，展示出鼠标`hover`代码的类型提示功能。如下所示：

```ts platform=browser
// 将鼠标放在变量上

interface Point {
  x: number;
  y: number;
}

function print(pt: Point) {
  console.log("The coordinate's x value is " + pt.x);
  console.log("The coordinate's y value is " + pt.y);
}

print({
  x: 100,
  y: 100,
});
```

## 选择方案

`TypeScript`语言的代码提示当然是来自于其自己的语言服务，我的博客是静态网站，在没有后端服务的基础上，代码提示都要放在前端来做。类似的东西，其实已经有了，那就是微软官方的`monaco-editor`在线编辑器。这个编辑器附带了 ts 语言的所有服务，功能特别强，唯一的问题就是太重了。作为一个静态博客，绝大部分内容都是静态的展示，没有代码编辑的需求，这样的话，就不太可能把这个编辑器搬上博客。
那么，不使用在线编辑器，而只是把语言服务搬入网页中呢？`TypeScript`的语言服务是文件`node_modules/typescript/lib/typescriptServices.js`，这个文件具体有多大大家可以自己看看。
总之，对于我这个静态博客来说，在线编辑器和语言服务都是不可接受的。那么就只剩下一个方案，将代码提示的结果全部在构建过程中就全部计算出来，这样的话，在前端只需要展示结果就行了，并不需要将语言服务搬上网页。


### 语言服务

通常情况下的语言服务，是在 VSCode 的插件中启动的，默认行为都是随着用户操作读取各种文件或者是给出提示。
在现在这种需求下，我们要拿到代码提示的结果，当然也就需要手动维护一个语言服务。这个语言服务的用户操作需要我们手动模拟出来，以及我们需要拦截读取文件的行为，不能让它随便读文件。因为我们的代码片段都是小块小块的，它们是如何构成和拼接的，这都需要我们手动维护。

`TypeScript`的语言服务是由两个部分组成的：

* `LanguageService`即语言服务本身，它提供语言服务对外的各种接口，代码提示，自动补全等等方法都在这里。
* `LanguageServiceHost`是给语言服务提供和项目交互的部分，读取文件，项目更新，等等操作在这里。

创建语言服务的代码非常简单，如下所示：

```ts
import * as ts from 'typescript';

const server = ts.createLanguageService(LanguageServiceHost);
```


所以，我们的重点就都在`LanguageServiceHost`上了，先来看看它的类型定义：

```ts
import * as ts from 'typescript';

interface LanguageServiceHost extends ts.GetEffectiveTypeRootsHost {
  getCompilationSettings(): ts.CompilerOptions;
  getNewLine?(): string;
  getProjectVersion?(): string;
  getScriptFileNames(): string[];
  getScriptKind?(fileName: string): ts.ScriptKind;
  getScriptVersion(fileName: string): string;
  getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined;
  getProjectReferences?(): readonly ts.ProjectReference[] | undefined;
  getLocalizedDiagnosticMessages?(): any;
  getCancellationToken?(): ts.HostCancellationToken;
  getCurrentDirectory(): string;
  getDefaultLibFileName(options: ts.CompilerOptions): string;
  log?(s: string): void;
  trace?(s: string): void;
  error?(s: string): void;
  useCaseSensitiveFileNames?(): boolean;
  readDirectory?(
    path: string,
    extensions?: readonly string[],
    exclude?: readonly string[],
    include?: readonly string[],
    depth?: number,
  ): string[];
  readFile?(path: string, encoding?: string): string | undefined;
  realpath?(path: string): string;
  fileExists?(path: string): boolean;
  getTypeRootsVersion?(): number;
  resolveModuleNames?(
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ): (ts.ResolvedModule | undefined)[];
  getResolvedModuleWithFailedLookupLocationsFromCache?(
    modulename: string,
    containingFile: string,
  ): ts.ResolvedModuleWithFailedLookupLocations | undefined;
  resolveTypeReferenceDirectives?(
    typeDirectiveNames: string[],
    containingFile: string,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ): (ts.ResolvedTypeReferenceDirective | undefined)[];
  getDirectories?(directoryName: string): string[];
  getCustomTransformers?(): ts.CustomTransformers | undefined;
  isKnownTypesPackageName?(name: string): boolean;
  installPackage?(options: ts.InstallPackageOptions): Promise<ts.ApplyCodeActionCommandResult>;
  writeFile?(fileName: string, content: string): void;
}
```

我们要这里维护的语言服务实际上并不用考虑持久性等等操作，因为我们只需要把我们的代码全都塞进去，然后拿到代码提示就行了，完全的一次性产物。所以这里的大部分可选函数都可以忽略，在这里实际上只需要这样的结构：

```ts
import * as ts from 'typescript';

interface LanguageServiceHost {
  getCompilationSettings(): ts.CompilerOptions;
  getScriptFileNames(): string[];
  getProjectVersion(): string;
  getScriptKind(fileName: string): ts.ScriptKind;
  getScriptVersion(fileName: string): string;
  getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined;
  getCurrentDirectory(): string;
  getDefaultLibFileName(options: ts.CompilerOptions): string;
}
```

#### `getCompilationSettings`

这个函数需要返回当前的编译选项，就是`tsconfig.json`文件内的`compilerOptions`字段内容，但是`module`等选项需要用`TypeScript`内部的枚举值，不能再用英文。
在现在的情况下，返回固定选项就可以了。附上我这里的值作为参考：

```ts
import * as ts from 'typescript';

function getCompilationSettings(): ts.CompilerOptions {
  return {
    strict: false,
    allowJs: true,
    jsx: ts.JsxEmit.React,
    allowSyntheticDefaultImports: true,
    target: ts.ScriptTarget.Latest,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ESNext,
    lib: [],
    types: [],
  };
}
```

#### `getScriptFileNames`

#### `getProjectVersion`

#### `getScriptKind`

#### `getScriptVersion`

#### `getScriptSnapshot`

#### `getCurrentDirectory`

#### `getDefaultLibFileName`
