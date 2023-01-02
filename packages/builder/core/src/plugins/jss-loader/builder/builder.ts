import type { BuilderInstance } from '@blog/types';
import { AssetExtractor } from './extractor';
import { builderCache } from '../store';

export async function getJssBuilder(entry: string, parent: BuilderInstance) {
  const key = `${entry}:${parent.name}:${parent.options.entry}`;
  const childBuilder = builderCache.has(key)
    ? builderCache.get(key)!
    : await parent.createChild({
        entry,
        name: 'JSS',
        write: false,
        logLevel: 'Silence',
        plugins: [AssetExtractor()],
      });

  if (!builderCache.has(key)) {
    builderCache.set(key, childBuilder);
    await childBuilder.init();
  }

  await childBuilder.build();

  return childBuilder;
}
