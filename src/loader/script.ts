import { BaseItem } from './base';
import { scriptFile } from 'src/config/project';

import * as path from 'path';
import * as fs from 'fs-extra';

export class ScriptItem extends BaseItem {
    buildTo = scriptFile;

    static async Create() {
        // ..
    }
}
