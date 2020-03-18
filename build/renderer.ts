import { build } from './post';

import * as fs from 'fs';
import * as util from './utils';

export async function render() {
    const posts = await build();

    debugger;
}
