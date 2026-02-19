declare module '*.svg' {
  const path: string;
  export default path;
}

declare module '*.ttf' {
  const path: string;
  export default path;
}

declare module '*.woff' {
  const path: string;
  export default path;
}

declare module '*.woff2' {
  const path: string;
  export default path;
}

declare module '*.ico' {
  const path: string;
  export default path;
}

declare module '*.plist' {
  const path: string;
  export default path;
}

declare module '*.wasm' {
  const path: string;
  export default path;
}

declare module '*?raw' {
  const buffer: Buffer;
  export default buffer;
}
