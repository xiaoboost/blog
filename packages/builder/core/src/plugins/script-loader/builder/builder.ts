import type { BuilderInstance, TransformState } from '@blog/types';
import { EntrySource, setEntrySource } from '../../entry-source';
import { JssLoader } from '../../jss-loader';
import { builderCache } from '../utils';
import { AssetExtractor } from './extractor';
import { Transformer } from './transformer';

export async function getScriptBuilder(
  entry: string,
  parent: BuilderInstance,
  source?: TransformState,
) {
  const key = `${entry}:${parent.name}:${parent.options.entry}`;
  const childBuilder = builderCache.has(key)
    ? builderCache.get(key)!
    : await parent.createChild({
      entry,
      name: 'Script',
      write: false,
      logLevel: 'Silence',
      plugins: [
        EntrySource(),
        AssetExtractor(),
        Transformer(),
        JssLoader({ extractAsset: true }),
      ],
    });

  if (!builderCache.has(key)) {
    builderCache.set(key, childBuilder);
  }

  setEntrySource(childBuilder, source);
  await childBuilder.build();

  return childBuilder;
}
