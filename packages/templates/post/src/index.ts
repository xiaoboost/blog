import { AssetData } from '@blog/utils';

export * from './post';
export const assets: AssetData[] = require('./index.script').default;
export const ModuleName = process.env.ModuleName as string;
