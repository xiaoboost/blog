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

# 方案概述

`TypeScript`语言的代码提示当然是来自于其自己的语言服务，我的博客是静态网站，在没有后端服务的基础上，代码提示都要放在前端来做。类似的东西，其实已经有了，那就是微软官方的`monaco-editor`在线编辑器。这个编辑器附带了 ts 语言的所有服务，功能特别强，唯一的问题就是太重了。作为一个静态博客，绝大部分内容都是静态的展示，没有代码编辑的需求，这样的话，就不太可能把这个编辑器搬上博客。
那么，不使用在线编辑器，而只是把语言服务搬入网页中呢？`TypeScript`的语言服务是文件`node_modules/typescript/lib/typescriptServices.js`，这个文件具体有多大大家可以自己看看。
总之，对于我这个静态博客来说，在线编辑器和语言服务都是不可接受的。那么就只剩下一个方案，将代码提示的结果全部在构建过程中就全部计算出来，这样的话，在前端只需要展示结果就行了，并不需要将语言服务搬上网页。

# 语言服务

通常情况下的语言服务，是在 VSCode 的插件中启动的，默认行为都是随着用户操作读取各种文件或者是给出提示。
在现在这种需求下，我们要拿到代码提示的结果，当然也就需要手动维护一个语言服务。这个语言服务的用户操作需要我们手动模拟出来，以及我们需要拦截读取文件的行为，不能让它随便读文件。
在博客中，代码都是一块一块的，当然不能直接将它们全部拼接起来，因为这些代码块很有可能都是相互冲突的。

我们可以维护一个`临时文件`，然后按照代码块的顺序，依次填充进这个临时文件中，拿到全部数据后，再塞入下一个代码块的代码，这样就可以避免代码块之间的冲突了。

`TypeScript`的语言服务是由两个部分组成的：

- `LanguageService`即语言服务本身，它提供语言服务对外的各种接口，代码提示，自动补全等等方法都在这里。
- `LanguageServiceHost`是给语言服务提供和项目交互的部分，读取文件，项目更新，等等操作在这里。

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
    moduleName: string,
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
  resolveModuleNames(
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ): (ts.ResolvedModule | undefined)[];
}
```

## `getCompilationSettings`

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

## `getScriptFileNames`

这个函数时在语言服务启动的时候运行的，目的是为了读取当前项目内所有的有效文件的路径，因为`ts`项目中可能还包含了不会被主动`import`的全局文件，所以需要用这种方式去获取。但是在我们这里并不需要这个，直接返回空数组就可以了。

## `getProjectVersion`

获取项目版本，这个版本号是用来判断是否更新语言服务内部状态的。每当有外部请求过来的时候，语言服务都会先获取这个版本号，如果版本号发生了变更，则会重新计算语言服务中的各种类型和状态。
在我们的需求中，这个肯定是需要的，我们每次将一个新的代码块塞进临时文件中，这个版本号就变更一次。

## `getScriptKind`

这个函数会传入文件的路径，然后由我们判断此文件的类型，这里可以很简单的用后缀来判断，对于我们的临时文件，则需要大家想办法从外部输入参数来判断到底是`ts`还是`js`文件了。

## `getScriptVersion`

这个函数时判断代码文件的版本，它的作用和`getProjectVersion`是类似的，每个文件都有这么一个标记。在语言服务更新内部状态时，它会先扫描所有文件版本号，只有发生变更的，才会进行下一步动作。

## `getScriptSnapshot`

这个函数是获取代码快照，代码快照的类型是这样的：

```ts
import * as ts from 'typescript';

interface IScriptSnapshot {
  /** Gets a portion of the script snapshot specified by [start, end). */
  getText(start: number, end: number): string;
  /** Gets the length of this script snapshot. */
  getLength(): number;
  /**
   * Gets the TextChangeRange that describe how the text changed between
   * this text and an older version.  This information is used by the
   * incremental parser to determine what sections of the script need
   * to be re-parsed.  'undefined' can be returned if the change range
   * cannot be determined.  However, in that case, incremental parsing will
   * not happen and the entire document will be re - parsed.
   */
  getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange | undefined;
  /** Releases all resources held by this script snapshot */
  dispose?(): void;
}
```

我们这里同样不需要考虑持久性等特性，`dispose`函数可以扔掉，`getChangeRange`函数返回`undefined`就行。我们可以构造一个通用的代码快照创建函数：

```ts
import * as ts from 'typescript';

function getScriptSnapshot(code: string): ts.IScriptSnapshot {
  return {
    getText: (start, end) => code.substring(start, end),
    getLength: () => code.length,
    getChangeRange: () => void 0,
  };
}
```

## `getCurrentDirectory`

返回项目根目录，一般是指含有`tsconfig.json`的目录，因为语言服务还要去搜索`node_modules`文件夹，这个路径决定了它搜索的起点。我们这里返回当前项目路径就可以了。

## `getDefaultLibFileName`

返回默认库名称，一般这里没有特殊操作的话，返回空数组就可以了。

## `resolveModuleNames`

这个函数主要用于获取模块，也就是代码中的`import`语句，在我们的代码中肯定少不了这个语句，所以这个函数也是无法省略的。不过这个函数并不需要我们自己手写模块路径的读取和映射，可以直接使用 ts 自己的模块获取函数。

```ts
import * as ts from 'typescript';

function resolveModuleNames(
  moduleNames: string[],
  containingFile: string,
  reusedNames?: string[],
  redirectedReference?: ts.ResolvedProjectReference,
  options?: ts.CompilerOptions,
): (ts.ResolvedModule | undefined)[] {
  return moduleNames.map((name) => {
    return ts.resolveModuleName(name, containingFile, options, ts.sys).resolvedModule;
  });
}
```

## 获取代码提示

在有了语言服务之后，我们就可以使用语言服务来获取代码提示了。
在此处我们假设用来放置代码块的的临时文件名为`/_template.ts`。

```ts
import * as ts from 'typescript';

const server: ts.LanguageService;

function getQuickInfoAtPosition(offset: number) {
  const infos = server.getQuickInfoAtPosition('/_template.ts', offset);

  if (!infos || !infos.displayParts) {
    return '';
  }

  return ts.displayPartsToString(infos.displayParts);
}
```

要求输入`offset`参数，这个参数就是真实用户的鼠标`hover`的位置。那么很明显，我们只需要枚举代码的每个位置，就可以拿到所有的提示数据了。
但是仔细想想，这么做也有问题，因为相当多位置的信息都是重复的。比如函数名称这么长的字符串，它们的类型提示肯定都是一样的，毕竟这里只会出现这个函数的类型。

所以我们有了新的问题：**如何跳过重复提示的字符？**

这个新问题我们先放放，来看看另一个问题——

# 代码高亮

代码高亮我们通常都会选用比较简单的`highlight.js`库，这个库的特点就是简单易用，输入代码，输出渲染好的，带`<code>`标签的网页源码。但是在我们现在的情况下有个致命的缺点。我们并不能把经过这个库处理的网页源码与我们得到的语言服务数据对应上。什么意思呢，我举个例子。

我们有这么一段源码：

```ts
const var1 = '123';
```

经过语言服务之后，我们知道在第`7`至`11`偏移的这段中间含有类型提示，我们需要在这里插入语言服务的数据。

但是这段代码在经过`highlight.js`之后，会生成诸如这样的代码：

```html
<pre>
  <code><span class="keyword">const</span> <span>var1</span>……</code>
</pre>
```

这里写的比较简略，大家意会一下就行。
我们是没办法从语言服务得到的偏移量对应到`highlight.js`的输出代码中的，它的输出也不带`sourcemap`，没办法反向对应到源码。

所以这里的代码高亮我们没办法使用`highlight.js`，就只能手动标记代码高亮。要将代码高亮，很明显就需要把代码分成不同成分，再联想到上一节中我们的问题。
那么答案就很明显了，在这里我们需要手动将代码切割成`Token`，以`Token`为单位做高亮和代码提示。

# 标记化

要将 ts 代码切割成`Token`，当然会想到使用 ts 库本身来做。但是我尝试了很久，ts 库本身并没有提供这个功能，那么我们只能独辟蹊径了。

代码高亮是任何一个代码编辑器都提供的功能，当然也包括 VSCode。VSCode 对代码做高亮是通过叫`TextMate`工具实现的。这是一个通用的代码高亮配置器，如果我们能找到 VSCode 如何调用这个库，那就能实现这个功能了。

我翻找了一下，甚至都准备好去翻它的源码了，结果让我发现这几个工具都单独开源出来了，不得不说微软在这方面做的确实不错。这里我们需要两个库：`vscode-textmate`、`vscode-oniguruma`。前者是用于解析`TextMate`配置，后者用于`Tokenize`代码。

有了工具库，那么我们还差 ts 代码的`TextMate`配置，难道我们自己写？当然不可能，微软这也准备好了，配置文件直接用这个文件就可以了：[TypeScript.tmLanguage](https://github.com/microsoft/TypeScript-TmLanguage/blob/master/TypeScript.tmLanguage)。

这里没有什么能介绍的原理，只是 API 调用而已：

```ts
import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

let tsGrammar: vsctm.IGrammar;

const tmLanguage = '这里放上文中提到的配置文件路径' as string;
const onigPath = 'node_modules/vscode-oniguruma/release/onig.wasm';

async function getGrammar() {
  const [ts, wasmBin] = await Promise.all([
    fs.readFile(resolveRoot(tmLanguage), 'utf-8'),
    fs.readFile(resolveRoot(onigPath)),
  ]);

  const vscodeOnigLib = oniguruma.loadWASM(wasmBin.buffer).then(() => ({
    createOnigScanner: (source: string[]) => {
      return new oniguruma.OnigScanner(source);
    },
    createOnigString: (str: string) => {
      return new oniguruma.OnigString(str);
    },
  }));

  const registry = new vsctm.Registry({
    onigLib: vscodeOnigLib,
    loadGrammar: (scopeName) => {
      if (scopeName === 'source.ts') {
        return Promise.resolve(vsctm.parseRawGrammar(ts));
      } else {
        throw new Error(`Unknown scopeName: ${scopeName}.`);
      }
    },
  });

  tsGrammar = (await registry.loadGrammar('source.ts'))!;
}

export function tokenize(code: string) {
  const lines = code.split(/[\n\r]/);
  const linesToken: vsctm.ITokenizeLineResult[] = [];

  let ruleStack = vsctm.INITIAL;

  for (let i = 0; i < lines.length; i++) {
    linesToken.push(tsGrammar.tokenizeLine(lines[i], ruleStack));
    ruleStack = lineTokens.ruleStack;
  }

  return linesToken;
}
```

# 渲染代码

## 代码块

到了这一步，我们已经获得了所有的数据，就差最后将代码渲染为对应的`HTML`文本。在上面的代码中，我们的`Token`数据类型是`vsctm.ITokenizeLineResult`，我们来看看它的结构：

```ts
interface StackElement {
  _stackElementBrand: void;
  readonly depth: number;
  clone(): StackElement;
  equals(other: StackElement): boolean;
}

interface IToken {
  /** token 的起点下标 */
  startIndex: number;
  /** token 的终点下标 */
  endIndex: number;
  /** token 标记的成分 */
  scopes: string[];
}

interface ITokenizeLineResult {
  readonly tokens: IToken[];
  readonly ruleStack: StackElement;
}
```

在`IToken`接口中，起点和终点可以让我们计算出它在源代码中的字符串，也可以利用起点作为偏移量，计算类型提示，`scopes`表明了当前`Token`的成分，可以利用它映射到对应的`className`，这样我们就实现了高亮。

代码块通常都使用`pre`标签包裹，每一行使用`li`标签，每个`Token`都是一个`span`标签。利用这样的规则我们就可以渲染出用于显示的代码块了。

## 保存类型提示数据

现在我们还剩下最后一个问题——**如何保存类型提示数据？**

保存数据是个很自由的事情，有很多方式都可以实现，这里可以介绍两种我都用过的：

### 保存在标签中

保存在标签属性中是很容易想到的，举个例子：

```html
<span class="interface-name" lsp="(interface) Name">Name</span>
```

在上面的代码中，我们把数据存到了标签的`lsp`属性中。在页面中，我们正常调用事件就能直接拿到它。
这种方式很直观，但是也有缺点，在标签中允许存在的字符都是有限制的，如果我们的代码提示中含有双引号，全角字符等等数据，就会导致标签渲染失败。然而，在代码提示中这类字符都挺常见的。所以我们在保存的时候需要进行转码，`decodeURI`函数是个不错的选择。

最后就是，这样生成的网页代码会很不好看。当然，这点不是很重要。

### 保存在单独的`script`标签中

```html
<script>
  const lspData = {
    'ts-0-0': '(interface) Name',
  };
</script>

<pre>
  <li><span class="interface-name" lsp="ts-0-0">Name</span></li>
</pre>
```

这样的话，由于数据全部都在`script`中，可以最大限度的利用`js`代码的灵活性，也不存在字符的问题了。就是不太直观，代码写起来也比较麻烦。

上述两种方式都很合适，大家可以自行选择。

## 页面事件

页面之中的代码就很简单的，相信大家都能想到，拿到所有的元素，然后绑定`mouseenter`和`mouseleave`事件然后操作用于显示的对话框就行。

# 总结

1. 构造语言服务，实际上我们是通过拦截它和文件之间的方法来实现我们的需求的。
2. 由于`highlight.js`没有位置信息，所以我们只能手动对源码实现`Tokenize`。
3. `Tokenize`使用 VSCode 官方的两个工具库实现，之后我们就能拿到所有想要的数据。使用`scopes`可以实现高亮，偏移量可以从语言服务拿到代码提示。
4. 最后我们需要将数据保存到页面，这样我们就实现了整个功能。
