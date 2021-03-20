declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'testing';
  }
}

declare module '*.ico' {
  const path: string;
  export default path;
}

declare module '*.styl' {
  const path: string;
  export default path;
}
