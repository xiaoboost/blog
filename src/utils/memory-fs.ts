import MemoryFs from 'memory-fs';

import { promisify } from 'util';

const memory = new MemoryFs();

export const stat = promisify(memory.stat.bind(memory));
export const rmdir = promisify(memory.rmdir.bind(memory));
export const mkdir = promisify(memory.mkdir.bind(memory));
export const mkdirp = promisify(memory.mkdirp.bind(memory));
export const readFile = promisify(memory.readFile.bind(memory));
export const readdir = promisify(memory.readdir.bind(memory));
export const writeFile = promisify(memory.writeFile.bind(memory));
export const exists = promisify(memory.exists.bind(memory));
export const unlink = promisify(memory.unlink.bind(memory));

export const existsSync = memory.existsSync.bind(memory);
export const readFileSync = memory.readFileSync.bind(memory);
export const createReadStream = memory.createReadStream.bind(memory);
