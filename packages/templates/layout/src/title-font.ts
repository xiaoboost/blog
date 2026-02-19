import { forEach, RuntimeBuilder as Builder } from '@blog/context/runtime';
import { titleFontBucket } from './utils/title';

forEach((runtime) => {
  runtime.hooks.afterPreBuild.tapPromise('layout:title-font', async () => {
    // 最小化字体文件
    await titleFontBucket.build();

    // 输出字体文件
    Builder.emitAsset(titleFontBucket.getFont());
  });
});
