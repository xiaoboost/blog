import * as path from 'path';
import * as fs from 'fs-extra';

import * as utils from './utils';
import * as site from '../config/site';
import * as project from '../config/project';

import less from 'less';

async function copyAssets() {
    await fs.copy(project.assetsPath, project.buildOutput);
    await fs.writeFile(path.join(project.buildOutput, 'CNAME'), site.site.link);
}

async function buildStyle() {
    const lessContent = await fs.readFile(project.styleEntryFile);
    const style = await less.render(lessContent.toString(), {
        paths: [
            path.resolve(project.styleEntryFile, '../'),
            path.resolve(project.styleEntryFile, '../../'),
        ],
    }).catch((e) => {
        throw new Error(e);
    });

    style.css;
    debugger;
}

async function buildScript() {

}

/** 生成全站资源文件 */
export async function build() {
    await copyAssets();
    await buildStyle();
    await buildScript();
}
