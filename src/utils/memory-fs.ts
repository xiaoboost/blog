import MemoryFs from 'memory-fs';

import { promisify } from 'util';

const memory = new MemoryFs();

export const stat = promisify(memory.stat);
export const rmdir = promisify(memory.rmdir);
export const mkdir = promisify(memory.mkdir);
export const mkdirp = promisify(memory.mkdirp);
export const readFile = promisify(memory.readFile);
export const readdir = promisify(memory.readdir);
export const writeFile = promisify(memory.writeFile);
export const exists = promisify(memory.exists);
export const unlink = promisify(memory.unlink);
