import * as path from 'path';
import * as fs from 'fs-extra';

import * as site from '../config/site';
import * as project from '../config/project';

async function copyAssets() {
    await fs.copy(project.assetsPath, project.buildOutput);
    await fs.writeFile(path.join(project.buildOutput, 'CNAME'), site.site.link);
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
