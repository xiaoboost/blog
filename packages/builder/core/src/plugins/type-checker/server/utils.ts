import { readFile } from 'fs/promises';
import type { TypeScriptConfig } from '../types';

/**
 * 读取 tsconfig 文件完整配置
 */
export async function readTsConfig(configFile: string, resolve: (target: string) => string) {
  const content = await readFile(configFile, 'utf-8');
  const tsConfig = JSON.parse(content) as TypeScriptConfig;

  if (tsConfig.extends) {
    const extendsTsConfig = await readTsConfig(resolve(tsConfig.extends), resolve);

    tsConfig.compilerOptions = {
      ...extendsTsConfig.compilerOptions,
      ...tsConfig.compilerOptions,
    };
  }

  delete tsConfig.extends;

  return tsConfig;
}
