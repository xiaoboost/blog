import { join } from 'path';

/** 指向项目根目录的绝对路径 */
export const resolve = (...dir: (string | number)[]) => {
    return join(__dirname, '../', ...dir.map(String));
};

/** html 修饰 */
export function fixHtml(html: string) {
    return '<!DOCTYPE html>' + html;
}
