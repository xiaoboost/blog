export interface EventData {
  /** 调用方法名称 */
  name: EventName;
  /** 方法参数 */
  params: any[];
}

export enum EventName {
  /** 文件变更 */
  FilesChanged,
  /** 开始运行服务器 */
  StartServer,
  /** 获取代码类型诊断 */
  GetTsDiagnostics,
  /** 停止服务器 */
  Dispose,
}

export interface TypeScriptConfig {
  extends?: string;
  compilerOptions?: any;
  include?: string[];
  exclude?: string[];
  files?: string[];
}

export interface TypeCheckerOptions {
  /** 起始路径 */
  basePath?: string;
  /**
   * 配置文件路径
   *   - `basePath`的相对路径
   *   - 绝对路径
   */
  configFile?: string;
  configOverwrite?: TypeScriptConfig;
  typescriptPath?: string;
}
