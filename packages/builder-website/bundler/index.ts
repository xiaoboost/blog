import { assets as extraAssets } from './extra';
import { assets as staticAssets } from './chunk';
import { build as buildPost } from './post';

export default staticAssets.concat(
  extraAssets,
  buildPost(),
);
