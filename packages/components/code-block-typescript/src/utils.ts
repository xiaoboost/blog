import type { PostExportData as PostData, Mdx } from '@blog/types';
import { builtinModules } from 'module';
import { join } from 'path';
import { mkdir, writeFile, stat } from 'fs/promises';
import { spawn } from 'child_process';
import type { ScriptKind as Kind, Platform } from './typescript';
import { devDependencies as devPkg } from '../package.json';

const TsLangMatcher = /^(t|j)sx?($|\?)/;
const DefaultLibs = ['@types/react', `@types/node@${devPkg['@types/node']}`];
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
      /^(\.)?\//.test(pkgName) ||
      builtinModules.includes(pkgName) ||
      pkgName.startsWith('@blog/') ||
      pkgName.startsWith('@@local/')
    ) {
      continue;
    }

    if (pkgName.startsWith('@types/')) {
      const realPkgName = pkgName.substring(7);

      if (result.has(realPkgName)) {
        result.delete(realPkgName);
      }

      result.add(pkgName);
    } else {
      const typePkgName = `@types/${pkgName}`;

      // 如果已经有 type 库，则跳过当前
      if (result.has(typePkgName)) {
        continue;
      } else {
        result.add(pkgName);
      }
    }
  }

  return result;
}

export function removeReference(code: string) {
  return code.replace(new RegExp(referenceRegex.source, 'g'), '').trim();
}

export function getTsCodeBlockConfig(node: Mdx.Syntax) {
  if (node.type === 'mdxJsxFlowElement' && node.name === 'TsCodeBlock') {
    const langAttr = node.attributes.find((attr) => attr.name === 'lang');
    const lspAttr = node.attributes.find((attr) => attr.name === 'lsp');
    const platformAttr = node.attributes.find((attr) => attr.name === 'platform');
    const langVal = (langAttr?.value?.value as string) ?? langAttr?.value ?? '';
    const platformVal = (platformAttr?.value?.value as string) ?? platformAttr?.value ?? 'none';
    const enableLsp = ((lspAttr?.value?.value as string) ?? lspAttr?.value ?? 'true') === 'true';

    if (!langAttr || !TsLangMatcher.test(langVal)) {
      return;
    }

    return {
      lang: langVal as Kind,
      // FIXME: 暂不处理
      code: (node.children[0] as any).value,
      platform: platformVal as Platform,
      enableLsp,
    };
  }

  if (node.type === 'code' && /^(t|j)sx?($|\?)/.test(node.lang ?? '')) {
    const [lang, meta] = node.lang!.split('?') as [Kind, Platform];
    const platformMeta = (meta ?? '')
      .split('&')
      .map((item) => item.split('='))
      .find((item) => item[0] === 'platform');
    const lspMeta = (meta ?? '')
      .split('&')
      .map((item) => item.split('='))
      .find((item) => item[0] === 'lsp');

    return {
      lang,
      code: node.value.trim(),
      platform: (platformMeta?.[1] ?? 'none') as Platform,
      enableLsp: (lspMeta?.[1] ?? 'true') === 'true',
    };
  }
}

/** 获取 TS 代码中的所有引用 */
export function getImportedByPost(posts: PostData[]) {
  const result = new Set(DefaultLibs);

  for (const { data: post } of posts) {
    for (const node of post.ast.children) {
      const blockConfig = getTsCodeBlockConfig(node);

      if (blockConfig && blockConfig?.enableLsp) {
        for (const pkg of getImportModuleTypes(blockConfig.code)) {
          result.add(pkg);
        }
      }
    }
  }

  return result;
}

export async function npmInstall(libs: string[], cwd: string, log?: (msg: string) => void) {
  if (libs.length === 0) {
    return Promise.resolve();
  }

  await mkdir(cwd, { recursive: true });

  const cachePackageJsonPath = join(cwd, 'package.json');

  try {
    await stat(cachePackageJsonPath);
  } catch (_) {
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

  return new Promise<void>((resolve, reject) => {
    const args = ['install', ...libs, '-D', '--ignore-scripts'];
    const childProcess = spawn('npm', args, {
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
      } else {
        reject(new Error(`npm install 运行出错，请使用 --log-level=Debug 参数来查看错误日志`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}
