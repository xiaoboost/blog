import { mkdirp } from 'fs-extra';

import { render } from './renderer';
import { build as buildAssets } from './assets';
import { buildOutput } from '../config/project';

async function main() {
    await mkdirp(buildOutput);
    await buildAssets();
    await render();
}

main();
