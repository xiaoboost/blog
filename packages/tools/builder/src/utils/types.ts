/** 构建编译选项 */
export interface BuildCommandOptions {
  outDir: string;
  mode: string;
}

/** 监听编译选项 */
export interface WatchCommandOptions {
  mode: string;
  hmr: boolean;
}
