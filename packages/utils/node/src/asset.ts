// export function getAssetContents(...data: any[]): Promise<AssetData[]> {
//   return Promise.all(
//     data
//       .map((item) => item.default ?? item)
//       .reduce((ans, item) => ans.concat(item), [])
//       .map(async (item: any) => ({
//         path: item.path as string,
//         content: (await item.getContent()) as Buffer,
//       })),
//   );
// }

// export function getAssetPaths(...data: any[]): string[] {
//   return data
//     .map((item) => item.default ?? item)
//     .reduce((ans, item) => ans.concat(item), [])
//     .map((item: any) => item.path);
// }

// export function mergeAssetContents(...data: Promise<AssetData[]>[]): Promise<AssetData[]> {
//   return Promise.all(data).then((list) => list.reduce((ans, item) => ans.concat(item), []));
// }
