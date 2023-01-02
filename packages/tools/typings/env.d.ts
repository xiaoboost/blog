declare namespace NodeJS {
  interface ProcessEnv {
    /** 当前 Node 环境 */
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}
