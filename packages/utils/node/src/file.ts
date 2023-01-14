import { writeFile as writeFileAsync, mkdir, rm } from 'fs/promises';
import { dirname } from 'path';

export async function writeFile(path: string, data: string | Buffer) {
  try {
    await rm(path);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFileAsync(path, data);
}
