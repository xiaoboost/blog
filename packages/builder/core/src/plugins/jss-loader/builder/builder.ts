import type { BuilderInstance, TransformState } from '@blog/types';
import { EntrySource, setEntrySource } from '../../entry-source';
import { builderCache } from '../store';
import { AssetExtractor } from './extractor';

export async function getJssBuilder(
  entry: string,
  parent: BuilderInstance,
  source?: TransformState,
) {
  const key = `${entry}:${parent.name}:${parent.options.entry}`;
  const childBuilder = builderCache.has(key)
    ? builderCache.get(key)!
    : await parent.createChild({
      entry,
      name: 'JSS',
      write: false,
      logLevel: 'Silence',
      plugins: [EntrySource(), AssetExtractor()],
    });

  if (!builderCache.has(key)) {
    builderCache.set(key, childBuilder);
  }

  setEntrySource(childBuilder, source);
  await childBuilder.build();

  return childBuilder;
}
