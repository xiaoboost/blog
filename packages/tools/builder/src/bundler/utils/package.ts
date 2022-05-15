import * as fs from 'fs/promises';
import * as lookup from 'look-it-up';

let externals: string[] | undefined;

export async function getExternalPkg() {
  if (externals) {
    return externals;
  }

  const packagePath = (await lookup.lookItUp('package.json', __dirname)) ?? '';
  const content = await fs.readFile(packagePath, 'utf-8');
  const data = JSON.parse(content);

  externals = Object.keys(data.dependencies)
    .filter((key) => !data.dependencies[key].startsWith('workspace') || key === '@blog/shared')
    .concat(
      Object.keys(data.devDependencies).filter(
        (key) => !data.devDependencies[key].startsWith('workspace'),
      ),
    );

  return externals.slice();
}
