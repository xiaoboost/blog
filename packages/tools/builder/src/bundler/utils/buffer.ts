export function getSize(assets: AssetData[]) {
  return assets.reduce((ans, item) => ans + Buffer.from(item.content).byteLength, 0);
}

export function getShortSize(size: number) {
  const units = ['B', 'kB', 'MB', 'GB'];

  let current = size;
  let rank = 0;

  while (current > 1024) {
    current = current / 1024;
    rank++;
  }

  if (current > 100) {
    return `${current} ${units[rank]}`;
  } else if (current > 10) {
    return `${Number(current.toFixed(1))} ${units[rank]}`;
  } else {
    return `${Number(current.toFixed(2))} ${units[rank]}`;
  }
}
