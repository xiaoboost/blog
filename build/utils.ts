import { join } from 'path';
import { existsSync } from 'fs';

export const resolve = (...dir: (string | number)[]) => {
    return process.env.NODE_ENV === 'development'
        ? join(__dirname, '../../', ...dir.map(String))
        : join(__dirname, '../', ...dir.map(String));
};
