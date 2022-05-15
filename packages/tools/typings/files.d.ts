/* eslint-disable @typescript-eslint/triple-slash-reference */

/// <reference path="./types.d.ts" />

declare module '*.ttf' {
  const data: AssetImportData;
  export default data;
}

declare module '*.ico' {
  const data: AssetImportData;
  export default data;
}

declare module '*.plist' {
  const data: AssetImportData;
  export default data;
}

declare module '*.wasm' {
  const data: AssetImportData;
  export default data;
}
