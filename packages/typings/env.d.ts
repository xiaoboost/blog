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

declare module '*.md' {
  const post: {
    html: string;
    content: string;
  };

  export default post;
}
