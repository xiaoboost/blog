import type { Mode } from './builder';

/** 源码当前的语法格式，可能不同于原文件扩展名 */
export type SourceFormat = 'mdx' | 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json';

/** 模块身份与来源 */
export interface ModuleInfo {
  readonly id: {
    readonly namespace: string;
    readonly path: string;
    readonly suffix: string;
  };
  /** 真实来源的绝对磁盘路径；虚拟模块可以没有 */
  readonly sourcePath?: string;
}

/** 标准的非分段 source map v3 数据 */
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
 * 每步转换的状态
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

/** 本次修改 */
export interface TransformChange {
  code: string;
  /** 未指定时沿用当前格式 */
  format?: SourceFormat;
  /** 未指定时沿用当前解析目录 */
  resolveDir?: string;
  /** 本步输出到本步输入的映射；identity 保留累计映射，null 切断映射链 */
  map: SourceMapV3 | 'identity' | null;
}

/** 单个模块的转换上下文 */
export interface TransformContext {
  /** 当前构建模式 */
  readonly mode: Mode;
  /** 合并修改 */
  update(
    input: Readonly<TransformState>,
    change: Readonly<TransformChange>,
  ): Readonly<TransformState>;
  /** 登记插件额外读取的文件依赖 */
  addWatchFile(absolutePath: string): void;
  /** 登记目录依赖，例如需要跟踪文件增删的模板目录 */
  addWatchDir(absolutePath: string): void;
}
