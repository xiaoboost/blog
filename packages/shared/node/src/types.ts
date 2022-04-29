export interface AssetData {
  path: string;
  contents: Buffer | string;
}

export type GetAsset = () => Promise<AssetData[]>;
