declare module '*.plist' {
  import { AssetData } from '@blog/utils';
  const asset: AssetData;
  export default asset;
}

declare module '*.wasm' {
  import { AssetData } from '@blog/utils';
  const asset: AssetData;
  export default asset;
}
