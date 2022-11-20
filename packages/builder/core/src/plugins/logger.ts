import type { BuilderPlugin } from '@blog/types';

import Moment from 'moment';
import createSpinner from 'ora';

const pluginName = 'logger';

// console.log(`[${Moment().format('hh:mm:ss')}]`, ...args);

export const LoggerPlugin = (): BuilderPlugin => ({
  name: 'logger',
  apply(builder) {
    const spinner = createSpinner({
      interval: 200,
    });

    builder.hooks.bundler.tap(pluginName, () => {
      spinner.text = '代码打包...';
      spinner.start();
    });

    builder.hooks.runner.tap(pluginName, () => {
      spinner.text = '运行构建...';
    });

    builder.hooks.endBuild.tap(pluginName, () => {
      spinner.stop();
    });
  },
});
