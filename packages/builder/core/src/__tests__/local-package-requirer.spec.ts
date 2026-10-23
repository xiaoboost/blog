import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, describe, it } from '@blog/test-toolkit';
import { build } from 'esbuild';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { Resolver } from '../plugins/resolver';

describe('LocalPackageRequirer', () => {
  it('实际打包保留两个子包各自的依赖版本，且不打包依赖源码', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-local-package-'));
    const builder = new Builder({ root, logLevel: 'Silence', typeCheck: false });
    const bundler = new Bundler(builder);

    try {
      LocalPackageRequirer().apply(builder);
      Resolver().apply(builder);
      builder.hooks.bundler.call(bundler);
      for (const name of ['one', 'two']) {
        const directory = join(root, name);
        const dependency = join(directory, 'node_modules/dep_name');
        await mkdir(dependency, { recursive: true });
        await writeFile(join(dependency, 'package.json'), JSON.stringify({
          name: 'dep_name',
          version: name === 'one' ? '1.0.0' : '2.0.0',
        }));
        await writeFile(join(dependency, 'sub_entry.cjs'), `module.exports = '${name}_dependency_source';`);
        await writeFile(join(directory, 'with_underscore.ts'), "export { default } from 'dep_name/sub_entry.cjs';");
      }
      const entry = join(root, 'index.ts');
      await writeFile(entry, "import one from './one/with_underscore'; import two from './two/with_underscore'; export default [one, two];");
      const result = await build({
        entryPoints: [entry],
        bundle: true,
        write: false,
        platform: 'node',
        format: 'cjs',
        plugins: [BridgePlugin(bundler, builder)],
      });
      const code = result.outputFiles![0].text;
      const module = { exports: {} as any };
      runInNewContext(code, { module, exports: module.exports, require });

      expect([...module.exports.default]).deep.eq(['one_dependency_source', 'two_dependency_source']);
      expect(code).not.contain('dependency_source');
    }
    finally {
      await bundler.dispose();
      await builder.stop();
      await rm(root, { recursive: true, force: true });
    }
  });
});
