import { ImportKind } from 'esbuild';

export interface ResolveResult {
  path: string;
  suffix?: string;
  external?: boolean;
  watchFiles?: string[];
}

export interface ResolveCreatorOptions {
  root: string;
  mainFields?: string[];
  mainFiles?: string[];
  extensions?: string[];
  external?: string[];
  alias?: Record<string, string>;
}

export interface ResolveOptions {
  /** 引用语句类型 */
  kind?: ImportKind;
  /** 引用文件 */
  importer?: string;
  /** 起始路径 */
  resolveDir?: string;
}

export interface PathData {
  /** 原始路径 */
  original: string;
  /** 基本路径 */
  basic: string;
  /** 路径参数 */
  query: Query;
  /** 路径参数原始字符串 */
  rawQuery?: string;
}

export type Query = Record<string, string | boolean>;
export type Resolver = (request: string, opt?: ResolveOptions) => ResolveResult;
