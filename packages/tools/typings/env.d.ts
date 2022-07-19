declare namespace NodeJS {
  interface ProcessEnv {
    /** 当前 Node 环境 */
    readonly NODE_ENV: 'development' | 'production' | 'test';
    /** 是否启用 HMR */
    readonly HMR: boolean;
  }
}
