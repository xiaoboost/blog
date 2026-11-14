import type { Accessor, AccessorGetter } from './accessor';
import type { BuilderInstance } from './builder';
import type { RuntimeHooks } from './hooks';
import type { IRenderContext } from './page';

/** onInit、onBuild 与 onBuildWithRender 共用的初始化上下文 */
export interface RuntimeContext {
  /** 构建生命周期钩子 */
  hooks: RuntimeHooks;
  /** 构建配置 */
  readonly options: BuilderInstance['options'];
  /** 构建日志 */
  readonly logger: BuilderInstance['logger'];

  /** 共享内存访问器 */
  getAccessor<T = any>(name: string): Accessor<T | undefined>;
  getAccessor<T = any>(name: string, defaultValue: () => T): Accessor<T>;
  getAccessor<T = any>(name: string, defaultValue: T): Accessor<T>;
  /** 共享只读访问器 */
  getAccessorWithGetter<T = any>(name: string, getter: () => T): AccessorGetter<T>;
  /** 共享对象引用 */
  getReference<T = any>(name: string, initialValue: T): T;
  /** 磁盘缓存访问器 */
  getCacheAccessor: BuilderInstance['getCacheAccessor'];
  /** 解析模块或文件路径 */
  resolve: BuilderInstance['resolve'];
  /** 登记文件依赖 */
  addWatchFiles: BuilderInstance['addWatchFiles'];
  /** 按构建规则生成资源名称 */
  renameAsset: BuilderInstance['renameAsset'];
  /** 向构建器提交产物 */
  emitAsset: BuilderInstance['emitAsset'];
  /** 记录处理耗时 */
  startMeasure: BuilderInstance['startMeasure'];
}

/** 每轮构建的初始化回调 */
export type BuildHook = (runtime: RuntimeContext) => void;

/** 首次构建的初始化回调 */
export type InitHook = BuildHook;

/** 注册每轮构建的初始化逻辑 */
export type OnBuild = (setup: BuildHook) => void;

/** 注册首次构建的初始化逻辑，在 onBuild 前执行 */
export type OnInit = (setup: InitHook) => void;

/** 注册构建初始化逻辑，并返回组件使用的渲染 hook */
export type OnBuildWithRender =
  <Input, Result = void>(
    setup: (runtime: RuntimeContext) => (input: Input, context: IRenderContext) => Result,
  ) => (input: Input) => Result;
