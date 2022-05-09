export function getSize(assets: AssetData[]) {
  return assets.reduce((ans, item) => ans + Buffer.from(item.content).byteLength, 0);
}
