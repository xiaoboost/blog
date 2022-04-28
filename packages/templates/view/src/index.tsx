export * from './main-index';
export * from './post-list';

import { AssetData } from '@blog/utils';
export const assets: AssetData[] = require('./index.script').default;
export const ModuleName = process.env.ModuleName as string;
