import * as path from 'path';
import * as fs from 'fs-extra';

import * as project from '../config/project';

function copyAssets() {
    return fs.copy(project.assetsPath, project.buildOutput);
}

async function buildStyle() {

}

async function buildScript() {

}

/** 生成全站资源文件 */
export async function build() {
    await copyAssets();
    await buildStyle();
    await buildScript();
}
