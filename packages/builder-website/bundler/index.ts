import { assets as extraAssets } from './extra';
import { assets as staticAssets } from './chunk';
import { assets as postAssets } from './post';
import { assets as listAssets } from './list';

export default staticAssets.concat(
  extraAssets,
  postAssets,
  listAssets,
);
