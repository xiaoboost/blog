import type { Mode } from './builder';

/** 源码当前的语法格式，可能不同于原文件扩展名 */
export type SourceFormat = 'mdx' | 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json';

/** 模块身份与来源；转换时 id 和 sourcePath 保持不变 */
export interface ModuleInfo {
  readonly id: {
    readonly namespace: string;
    readonly path: string;
    readonly suffix: string;
  };
  /** 真实来源的绝对磁盘路径；虚拟模块可以没有 */
  readonly sourcePath?: string;
}

/** 标准的非分段 source map v3 数据，不绑定具体映射库 */
export interface SourceMapV3 {
  readonly version: 3;
  readonly file?: string;
  readonly sourceRoot?: string;
  readonly sources: readonly string[];
  readonly sourcesContent?: readonly (string | null)[];
  readonly names: readonly string[];
  readonly mappings: string;
}

/**
 * 每步转换接收和返回的完整状态。
 * Waterfall 直接传递返回值，不自动合并部分字段；跳过时返回原状态。
 * 可调用 context.update，也可直接构造新状态；后者需自行维护累计映射。
 */
export interface TransformState {
  readonly module: ModuleInfo;
  readonly code: string;
  readonly format: SourceFormat;
  /** 当前代码中相对 import 的解析目录 */
  readonly resolveDir?: string;
  /** 累计映射；identity 表示位置未变，null 表示没有可靠映射 */
  readonly map: SourceMapV3 | 'identity' | null;
}

/** 传给 context.update 的本步修改，不可直接作为钩子的返回值 */
export interface TransformChange {
  code: string;
  /** 未指定时沿用当前格式 */
  format?: SourceFormat;
  /** 未指定时沿用当前解析目录 */
  resolveDir?: string;
  /** 本步输出到本步输入的映射；identity 保留累计映射，null 切断映射链 */
  map: SourceMapV3 | 'identity' | null;
}

/** 单个模块的转换上下文，不在并发模块间共享可变状态 */
export interface TransformContext {
  readonly mode: Mode;
  /** 可选辅助方法：校验并合并修改、连接本步映射，返回新状态；不修改 input */
  update(input: TransformState, change: TransformChange): TransformState;
  /** 登记插件额外读取的文件依赖 */
  addWatchFile(absolutePath: string): void;
  /** 登记目录依赖，例如需要跟踪文件增删的模板目录 */
  addWatchDir(absolutePath: string): void;
}
