import * as fs from 'fs/promises';
import * as lookup from 'look-it-up';

export async function getExternalPkg() {
  const packagePath = (await lookup.lookItUp('package.json', __dirname)) ?? '';
  const content = await fs.readFile(packagePath, 'utf-8');
  const data = JSON.parse(content);

  return Object.keys(data.dependencies)
    .filter((key) => !data.dependencies[key].startsWith('workspace'))
    .concat(['@blog/shared', 'typescript']);
}
