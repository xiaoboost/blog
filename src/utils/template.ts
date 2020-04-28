import * as path from 'path';

import { publicPath } from 'src/config/project';

/** 网页模板路径相加 */
export const resolvePublic = (...paths: string[]) => {
    return path.join(publicPath, ...paths).replace(/[\\\/]+/g, '/');
};
