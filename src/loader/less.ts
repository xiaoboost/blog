import less from 'less';

import { BaseItem } from './base';
import { styleFile } from 'src/config/project';

import * as path from 'path';
import * as fs from 'fs-extra';

export class LessItem extends BaseItem {
    buildTo = styleFile;

    static async Create() {
        // ..
    }
}
