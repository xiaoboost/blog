import type { BuilderInstance, TransformState } from '@blog/types';
import { EntrySource, setEntrySource } from '../../entry-source';
import { JssLoader } from '../../jss-loader';
import { postAssetsNamespace } from '../../post-loader/assets';
import { builderCache } from '../utils';
import { AssetExtractor } from './extractor';
import { Transformer } from './transformer';

export async function getScriptBuilder(
  entry: string,
  parent: BuilderInstance,
  source?: TransformState,
  publicPath = parent.options.publicPath,
) {
  const cssName = source?.module.id.namespace === postAssetsNamespace
    && new URLSearchParams(source.module.id.suffix.slice(1)).get('outDir')
    ? 'styles'
    : undefined;
  const key = `${entry}:${parent.name}:${parent.options.entry}:${publicPath}`;
  const childBuilder = builderCache.has(key)
    ? builderCache.get(key)!
    : await parent.createChild({
      entry,
      name: 'Script',
      publicPath,
      write: false,
      logLevel: 'Silence',
      plugins: [
        EntrySource(),
        AssetExtractor(cssName),
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
