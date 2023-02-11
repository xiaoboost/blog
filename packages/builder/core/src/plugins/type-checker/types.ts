export interface EventData {
  /** 事件编号 */
  id: number;
  /** 调用方法名称 */
  name: EventName;
  /** 方法参数 */
  params: any[];
  /** 返回数据 */
  return?: any;
  /** 运行错误 */
  error?: EventError;
}

export interface EventError {
  /** 错误名称 */
  name: string;
  /** 错误信息 */
  message: string;
}

export enum EventName {
  /** 文件变更 */
  FileChanged,
  /** 新文件 */
  FileCreated,
  /** 开始运行服务器 */
  StartServer,
  /** 获取代码类型诊断 */
  GetTsDiagnostics,
}

export interface TypeScriptConfig {
  extends?: string;
  compilerOptions?: any;
  include?: string[];
  exclude?: string[];
  files?: string[];
}

export interface TypeCheckerOptions {
  configFile?: string;
  configOverwrite?: TypeScriptConfig;
  typescriptPath?: string;
}
