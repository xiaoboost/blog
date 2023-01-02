import path from 'path';

import { createTypeCheckerReporter } from './reporter';

process.on('message', (message: { cwd: string }) => {
  createTypeCheckerReporter({
    typescriptPath: require.resolve('typescript', {
      paths: [message.cwd],
    }),
    configPath: path.join(message.cwd, './tsconfig.json'),
  });
});
