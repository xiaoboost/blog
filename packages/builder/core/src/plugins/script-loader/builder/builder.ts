import type { BuilderInstance } from '@blog/types';
import { AssetExtractor } from './extractor';
import { Transformer } from './transformer';
import { builderCache } from '../utils';
import { JssLoader } from '../../jss-loader';

export async function getScriptBuilder(entry: string, parent: BuilderInstance) {
  const key = `${entry}:${parent.name}:${parent.options.entry}`;
  const childBuilder = builderCache.has(key)
    ? builderCache.get(key)!
    : await parent.createChild({
        entry,
        name: 'Script',
        write: false,
        logLevel: 'Silence',
        plugins: [AssetExtractor(), Transformer(), JssLoader({ extractCss: true })],
      });

  if (!builderCache.has(key)) {
    builderCache.set(key, childBuilder);
    await childBuilder.init();
  }

  await childBuilder.build();

  return childBuilder;
}
