export function getSize(assets: AssetData[]) {
  return assets.reduce((ans, item) => ans + Buffer.from(item.content).byteLength, 0);
}

function getShortString(current: number, unit: string) {
  if (current > 100) {
    return `${current} ${unit}`;
  } else if (current > 10) {
    return `${Number(current.toFixed(1))} ${unit}`;
  } else {
    return `${Number(current.toFixed(2))} ${unit}`;
  }
}

export function getShortSize(size: number) {
  const units = ['B', 'kB', 'MB', 'GB'];

  let current = size;
  let rank = 0;

  while (current > 1024) {
    current = current / 1024;
    rank++;
  }

  return getShortString(current, units[rank]);
}

export function getShortTime(time: number) {
  const units = ['毫秒', '秒', '分钟', '小时'];
  const ranks = [1000, 60, 60, Infinity];

  let current = time;
  let level = 0;

  while (current > ranks[level]) {
    current = current / ranks[level];
    level++;
  }

  return getShortString(current, units[level]);
}
