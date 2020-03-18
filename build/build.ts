import { render } from './renderer';
import { buildOutput } from './config/project';

// 生产模式
process.env.NODE_ENV === 'production';

async function main() {
    await render();
}

main();
