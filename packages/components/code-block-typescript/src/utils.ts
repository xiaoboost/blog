import { spawn } from 'child_process';
import { createHash } from 'crypto';
import {
  mkdir,
  writeFile,
  stat,
  readFile,
  rm,
} from 'fs/promises';
import { builtinModules } from 'module';
import { join } from 'path';
import type { PostExportData as PostData, Mdx } from '@blog/types';
import { devDependencies as devPkg } from '../package.json';

const DefaultLibs = [`@types/react@${devPkg['@types/react']}`, `@types/node@${devPkg['@types/node']}`];
const importRegex = /^import([\s\S]*?from)? ?['"]([^'"]+)['"]/;
const referenceRegex = /\/\/\/ <reference([\s\S]*?)import-type=['"]([^'"]+?)['"][^/]*?\/>/;

function getImportModuleTypes(code: string) {
  const result = new Set<string>();

  let content = code;

  while (content.length > 0) {
    const importMatchResult = importRegex.exec(content);
    const referenceMatchResult = referenceRegex.exec(content);
    const matchResult =
      importMatchResult && referenceMatchResult
        ? referenceMatchResult.index < importMatchResult.index
          ? referenceMatchResult
          : importMatchResult
        : importMatchResult ?? referenceMatchResult;

    if (!matchResult) {
      content = content.substring(1);
      continue;
    }

    // 更新文本
    content = content.substring(matchResult.index + matchResult[0].length);

    const pkgName = matchResult[2];

    // 跳过路径和 nodejs 内置库还有 blog 内置库以及临时包
    if (
      /^(\.)?\//.test(pkgName)
      || builtinModules.includes(pkgName)
      || pkgName.startsWith('@blog/')
      || pkgName.startsWith('@@local/')
    ) {
      continue;
    }

    if (pkgName.startsWith('@types/')) {
      const realPkgName = pkgName.substring(7);

      if (result.has(realPkgName)) {
        result.delete(realPkgName);
      }

      result.add(pkgName);
    }
    else {
      const typePkgName = `@types/${pkgName}`;

      // 如果已经有 type 库，则跳过当前
      if (result.has(typePkgName)) {
        continue;
      }
      else {
        result.add(pkgName);
      }
    }
  }

  return result;
}

export function removeReference(code: string) {
  return code.replace(new RegExp(referenceRegex.source, 'g'), '').trim();
}

/** 围栏已由 parser 转成组件，这里只还原代码，不再解析配置。 */
export function getTsCodeBlockCode(node: Mdx.Nodes): string | undefined {
  if (node.type !== 'mdxJsxFlowElement' || node.name !== 'TsCodeBlock') {
    return;
  }

  const child = node.children[0];

  if (!child || !('value' in child)) {
    return;
  }

  if (child.type === 'mdxFlowExpression') {
    try {
      const code: unknown = JSON.parse(child.value);
      return typeof code === 'string' ? code : undefined;
    }
    catch {
      // 手写表达式沿用原来的源码扫描方式，不执行表达式。
      return child.value;
    }
  }

  return child.value;
}

/** 获取 TS 代码中的所有引用 */
export function getImportedByPost(posts: PostData[]) {
  const result = new Set<string>();

  for (const { data: post } of posts) {
    const visit = (node: Mdx.Nodes) => {
      const code = getTsCodeBlockCode(node);

      if (code !== undefined) {
        DefaultLibs.forEach((pkg) => result.add(pkg));
        for (const pkg of getImportModuleTypes(code)) {
          result.add(pkg);
        }
      }

      if ('children' in node) {
        node.children.forEach(visit);
      }
    };
    visit(post.ast);
  }

  return result;
}

const installStamp = '.blog-install.json';

async function getInstallFingerprint(cwd: string) {
  const files = await Promise.all(['package.json', 'package-lock.json', 'node_modules/.package-lock.json'].map((file) => readFile(join(cwd, file))));
  return createHash('sha256').update(Buffer.concat(files)).digest('hex');
}

/** 仅复用成功安装过的依赖集合，同时检查 lockfile 中的包是否仍在磁盘上。 */
export async function isInstallCurrent(libs: string[], cwd: string): Promise<boolean> {
  try {
    const stamp = JSON.parse(await readFile(join(cwd, installStamp), 'utf8'));

    if (stamp.fingerprint !== await getInstallFingerprint(cwd)
      || !libs.every((lib) => stamp.libs.includes(lib))) {
      return false;
    }

    // npm 的隐藏锁文件只记录实际安装的包，不包含其他操作系统的可选依赖。
    const lock = JSON.parse(await readFile(join(cwd, 'node_modules/.package-lock.json'), 'utf8'));
    const packages = Object.entries(lock.packages ?? {}).filter(([path]) => path.startsWith('node_modules/'));

    if (packages.length === 0) {
      return false;
    }

    return (await Promise.all(packages.map(async ([path, info]) => {
      const installed = JSON.parse(await readFile(join(cwd, path, 'package.json'), 'utf8'));
      return installed.version === (info as { version: string }).version;
    }))).every(Boolean);
  }
  catch {
    return false;
  }
}

export async function npmInstall(libs: string[], cwd: string, log?: (msg: string) => void) {
  if (libs.length === 0) {
    return Promise.resolve();
  }

  if (await isInstallCurrent(libs, cwd)) {
    log?.('依赖缓存完整，跳过 npm install');
    return;
  }

  await mkdir(cwd, { recursive: true });
  // 安装失败或被中断后，下一次必须重试。
  await rm(join(cwd, installStamp), { force: true });

  const cachePackageJsonPath = join(cwd, 'package.json');

  try {
    await stat(cachePackageJsonPath);
  }
  catch {
    await writeFile(
      cachePackageJsonPath,
      JSON.stringify(
        {
          name: 'cache',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );
  }

  await new Promise<void>((resolve, reject) => {
    const args = [
      'install',
      ...libs,
      '-D',
      '--ignore-scripts',
      '--prefer-offline',
      '--no-audit',
      '--no-fund',
    ];
    // shell: true 必需（Windows 上 npm 是脚本），拼成完整命令字符串避免 DEP0190
    const childProcess = spawn(`npm ${args.join(' ')}`, {
      shell: true,
      stdio: 'pipe',
      cwd,
    });

    if (log) {
      log(`执行命令 - npm ${args.join(' ')}`);

      childProcess.stdout.on('data', (msg) => {
        log(msg.toString().trim());
      });
      childProcess.stdout.on('error', (msg) => {
        log(msg.toString().trim());
      });
      childProcess.stderr.on('data', (msg) => {
        log(msg.toString().trim());
      });
    }

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      }
      else {
        reject(new Error('npm install 运行出错，请使用 --log-level=Debug 参数来查看错误日志'));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
  await writeFile(join(cwd, installStamp), JSON.stringify({
    libs: [...new Set(libs)].sort(),
    fingerprint: await getInstallFingerprint(cwd),
  }));
}
