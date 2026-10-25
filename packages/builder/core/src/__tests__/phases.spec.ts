import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import type { BuildTiming } from '@blog/types';
import { describe, it } from 'mocha';
import { Builder } from '../builder/builder';
import { AssetWriter } from '../plugins/asset-writer';
import { Interceptor } from '../plugins/interceptor';
import { getBuildReport } from '../plugins/interceptor/report';

/** 只替换打包和脚本加载，保留 Builder 的完整生命周期与实际插件执行。 */
function controlledBuilder(root = process.cwd()) {
  const builder = new Builder({
    root,
    watch: true,
    logLevel: 'Silence',
    typeCheck: false,
  });
  const internals = builder as unknown as {
    bundler: {
      bundle(): Promise<void>;
      getBundledCode(): { source: string };
    };
    runner: { run(): Promise<void> };
  };
  internals.bundler.bundle = async () => {};
  internals.bundler.getBundledCode = () => ({ source: '' });
  internals.runner.run = async () => {};
  return builder;
}

function timing(builder: Builder, name: string) {
  const result = builder.getTimings().find((item) => item.name === name);
  assert.ok(result, `缺少计时记录 ${name}`);
  return result;
}

const endTime = (item: BuildTiming) => item.startTime + item.duration;

describe('构建阶段计时与报告', () => {
  it('普通构建也可以开始和结束计时，返回快照不能修改内部数据', () => {
    const builder = new Builder({ logLevel: 'Silence', typeCheck: false });
    const beforeStart = performance.now();
    const end = builder.startMeasure('custom');
    const afterStart = performance.now();
    assert.deepEqual(builder.getTimings(), [], '尚未结束的阶段不生成记录');
    end();

    const snapshot = builder.getTimings();
    assert.equal(snapshot.length, 1);
    const original = { ...snapshot[0] };
    assert.equal(original.name, 'custom');
    assert.ok(original.startTime >= beforeStart && original.startTime <= afterStart);
    assert.ok(original.duration >= 0);
    assert.ok(endTime(original) <= performance.now());
    snapshot[0].name = 'changed';
    snapshot[0].duration = -1;
    snapshot.length = 0;
    assert.deepEqual(builder.getTimings(), [original]);
  });

  it('结束函数重复调用只记录一次，保留第一次结束时的耗时', () => {
    const builder = new Builder({ logLevel: 'Silence', typeCheck: false });
    const end = builder.startMeasure('once');
    end();
    const first = builder.getTimings();
    end();
    end();
    assert.equal(first.length, 1);
    assert.deepEqual(builder.getTimings(), first);
  });

  it('不同 Builder 及父子构建器的计时互不混入', () => {
    const parent = new Builder({ logLevel: 'Silence', typeCheck: false });
    const child = new Builder({ logLevel: 'Silence', typeCheck: false }, parent);
    const other = new Builder({ logLevel: 'Silence', typeCheck: false });
    parent.startMeasure('parent')();
    child.startMeasure('child')();
    other.startMeasure('other')();

    assert.deepEqual(parent.getTimings().map((item) => item.name), ['parent']);
    assert.deepEqual(child.getTimings().map((item) => item.name), ['child']);
    assert.deepEqual(other.getTimings().map((item) => item.name), ['other']);
  });

  it('上一轮尚未结束的计时不会写入下一轮构建记录', async () => {
    const builder = controlledBuilder();
    let staleEnd!: () => void;
    let rounds = 0;
    builder.hooks.start.tap('capture-first-end', () => {
      if (++rounds === 1) {
        staleEnd = builder.startMeasure('stale-first-round');
      }
    });
    try {
      await builder.build();
      await builder.build();
      const current = builder.getTimings();
      staleEnd();
      assert.deepEqual(builder.getTimings(), current);
      assert.ok(!current.some((item) => item.name === 'stale-first-round'));
    }
    finally {
      await builder.stop();
    }
  });

  it('调试钩子明细也按 Builder 隔离，并按每轮重建重置', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-timing-report-isolation-'));
    const first = controlledBuilder(join(root, 'first'));
    const second = controlledBuilder(join(root, 'second'));
    const firstPath = join(first.root, 'report.md');
    const secondPath = join(second.root, 'report.md');
    let entered!: () => void;
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let firstRounds = 0;
    first.hooks.beforeBundler.tap('only-first', () => {});
    second.hooks.beforeBundler.tap('only-second', () => {});
    first.hooks.beforeBundler.tapPromise('pause-first', async () => {
      if (++firstRounds === 1) {
        entered();
        await gate;
      }
    });
    for (const builder of [first, second]) {
      builder.options.debug = true;
      builder.options.reportFile = 'report.md';
      Interceptor().apply(builder);
      builder.hooks.afterInitialized.call(builder);
    }
    let runningFirst: Promise<void> | undefined;
    try {
      runningFirst = first.build();
      await paused;
      await second.build();
      release();
      await runningFirst;
      const firstReport = await readFile(firstPath, 'utf8');
      const secondReport = await readFile(secondPath, 'utf8');
      assert.match(firstReport, /\|only-first\|Builder\|beforeBundler\|1\|/);
      assert.doesNotMatch(firstReport, /\|only-second\|/);
      assert.match(secondReport, /\|only-second\|Builder\|beforeBundler\|1\|/);
      assert.doesNotMatch(secondReport, /\|only-first\|/);

      await first.build();
      const rebuiltReport = await readFile(firstPath, 'utf8');
      assert.match(rebuiltReport, /\|only-first\|Builder\|beforeBundler\|1\|/, '第二轮只统计本轮回调，不累加第一轮');
      assert.doesNotMatch(rebuiltReport, /\|only-second\|/);
      assert.equal(await readFile(secondPath, 'utf8'), secondReport, '重建不覆盖另一构建器的报告');
    }
    finally {
      release();
      await Promise.allSettled([runningFirst]);
      await Promise.all([first.stop(), second.stop()]);
      await rm(root, { recursive: true, force: true });
    }
  });

  it('每次实际重建清空旧数据，没有变更时保留上一次报告数据', async () => {
    const builder = controlledBuilder();
    const file = join(builder.root, 'timing-fixture.ts');
    let buildNumber = 0;
    let reports = 0;
    builder.hooks.start.tap('test-generation', () => {
      builder.startMeasure(`round-${++buildNumber}`)();
    });
    builder.hooks.buildEnd.tap('test-report', () => reports++);
    try {
      await builder.build();
      const first = builder.getTimings();
      builder.addWatchFiles(file);
      await builder.build();
      assert.deepEqual(builder.getTimings(), first);
      assert.equal(reports, 1);

      builder.setChangeFiles(file);
      await builder.build();
      assert.equal(buildNumber, 2);
      assert.equal(reports, 2);
      assert.ok(builder.getTimings().some((item) => item.name === 'round-2'));
      assert.ok(!builder.getTimings().some((item) => item.name === 'round-1'));
      assert.equal(builder.getTimings().filter((item) => item.name === 'builder.total').length, 1);
      assert.ok(first.some((item) => item.name === 'round-1'), '旧快照不随后续重建变化');
    }
    finally {
      await builder.stop();
    }
  });

  it('代码打包与检查覆盖准备和检查钩子，成功构建只记录三个阶段与总计', async () => {
    const builder = controlledBuilder();
    let prepareStart = 0;
    let beforeBundleStart = 0;
    let checkStart = 0;
    let checkEnd = 0;
    builder.hooks.start.tap('test-start', () => {
      prepareStart = performance.now();
    });
    builder.hooks.beforeBundler.tap('test-prepare', () => {
      beforeBundleStart = performance.now();
    });
    builder.hooks.afterBundler.tapPromise('test-check', async () => {
      checkStart = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 10));
      checkEnd = performance.now();
    });
    try {
      await builder.build();
      const bundle = timing(builder, 'builder.bundle');
      assert.ok(bundle.startTime <= prepareStart);
      assert.ok(prepareStart <= beforeBundleStart && beforeBundleStart <= checkStart);
      assert.ok(endTime(bundle) >= checkEnd);
      assert.deepEqual(builder.getTimings().map((item) => item.name), [
        'builder.bundle',
        'builder.generate',
        'builder.output',
        'builder.total',
      ]);
    }
    finally {
      await builder.stop();
    }
  });

  for (const changed of [false, true]) {
    it(`构建期间再次请求：${changed ? '有新变更时追加一轮' : '无新变更时复用同一轮'}`, async () => {
      const builder = controlledBuilder();
      const file = join(builder.root, 'concurrent-timing-fixture.ts');
      builder.addWatchFiles(file);
      builder.setChangeFiles(file);
      let entered!: () => void;
      let release!: () => void;
      const paused = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let rounds = 0;
      let reports = 0;
      let successCalls = 0;
      let firstReport: BuildTiming[] = [];
      builder.hooks.beforeBundler.tapPromise('pause-first-build', async () => {
        rounds++;

        if (rounds === 1) {
          entered();
          await gate;
        }
      });
      builder.hooks.success.tap('count-success', () => successCalls++);
      builder.hooks.buildEnd.tap('count-reports', () => {
        if (++reports === 1) {
          firstReport = builder.getTimings();
        }
      });
      try {
        const first = builder.build();
        await paused;

        if (changed) {
          builder.setChangeFiles(file);
        }

        const second = builder.build();
        release();
        await Promise.all([first, second]);
        assert.equal(rounds, changed ? 2 : 1);
        assert.equal(reports, rounds, '每轮构建只输出一次报告');
        assert.equal(successCalls, changed ? 3 : 2, '等待完成后仍重放原来的成功钩子');
        assert.equal(builder.getTimings().filter((item) => item.name === 'builder.total').length, 1);

        if (!changed) {
          assert.deepEqual(builder.getTimings(), firstReport, '成功钩子重放不追加阶段计时');
        }
      }
      finally {
        release();
        await builder.stop();
      }
    });
  }

  it('等待失败构建后重放失败钩子，但不追加计时或重复报告', async () => {
    const builder = controlledBuilder();
    const file = join(builder.root, 'failed-concurrent-timing-fixture.ts');
    builder.addWatchFiles(file);
    builder.setChangeFiles(file);
    let entered!: () => void;
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let failedCalls = 0;
    let reports = 0;
    let firstReport: BuildTiming[] = [];
    builder.hooks.beforeBundler.tapPromise('pause-before-failure', async () => {
      entered();
      await gate;
      throw new Error('expected shared failure');
    });
    builder.hooks.failed.tap('count-failures', () => failedCalls++);
    builder.hooks.buildEnd.tap('capture-failure-report', () => {
      reports++;
      firstReport = builder.getTimings();
    });
    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    try {
      first = builder.build();
      await paused;
      second = builder.build();
      release();
      await Promise.all([first, second]);
      assert.equal(failedCalls, 2);
      assert.equal(reports, 1);
      assert.equal(builder.getErrors().length, 1);
      assert.deepEqual(builder.getTimings(), firstReport);
      assert.deepEqual(firstReport.map((item) => item.name), ['builder.total']);
    }
    finally {
      release();
      await Promise.allSettled([first, second]);
      await builder.stop();
    }
  });

  it('成功钩子异常仍向调用者抛出，不转成失败钩子或成功报告', async () => {
    const builder = controlledBuilder();
    const expected = new Error('expected success hook rejection');
    let failedCalls = 0;
    let reports = 0;
    builder.hooks.success.tapPromise('reject-success', async () => {
      throw expected;
    });
    builder.hooks.failed.tap('count-failures', () => failedCalls++);
    builder.hooks.buildEnd.tap('count-reports', () => reports++);
    try {
      await assert.rejects(builder.build(), (error) => error === expected);
      assert.equal(failedCalls, 0);
      assert.equal(reports, 0);
      assert.deepEqual(builder.getErrors(), []);
      assert.ok(!builder.getTimings().some((item) => item.name === 'builder.output'));
    }
    finally {
      await builder.stop();
    }
  });

  it('非监听构建在退出清理完成前已释放构建状态', async function () {
    this.timeout(5000);
    const builder = controlledBuilder();
    const file = join(builder.root, 'cleanup-timing-fixture.ts');
    builder.addWatchFiles(file);
    builder.setChangeFiles(file);
    builder.options.watch = false;
    const originalStop = builder.stop.bind(builder);
    let entered!: () => void;
    let release!: () => void;
    const stopping = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    builder.stop = async () => {
      entered();
      await gate;
      await originalStop();
    };
    let first: Promise<void> | undefined;
    try {
      first = builder.build();
      await stopping;
      const recorded = builder.getTimings();
      await Promise.race([
        builder.build(),
        new Promise<void>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('构建状态未在退出清理前释放')), 1000);
        }),
      ]);
      assert.deepEqual(builder.getTimings(), recorded);
    }
    finally {
      clearTimeout(timeout);
      release();
      await first;
      await originalStop();
    }
  });

  it('总耗时包含成功钩子与真实写盘，报告在写盘后生成且不计入总耗时', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-timing-write-'));
    const builder = controlledBuilder(root);
    builder.options.debug = true;
    builder.options.reportFile = 'reports/build.md';
    const output = join(root, 'dist', 'index.html');
    let successEnd = 0;
    let reportStart = 0;
    builder.emitAsset({ path: 'index.html', content: Buffer.from('written') });
    AssetWriter().apply(builder);
    builder.hooks.success.tapPromise('test-late-success', async () => {
      assert.equal(await readFile(output, 'utf8'), 'written');
      await new Promise((resolve) => setTimeout(resolve, 10));
      successEnd = performance.now();
    });
    builder.hooks.buildEnd.tapPromise('test-before-report', async () => {
      reportStart = performance.now();
      assert.ok(endTime(timing(builder, 'builder.total')) >= successEnd);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    Interceptor().apply(builder);
    try {
      await builder.build();
      const total = timing(builder, 'builder.total');
      const outputTiming = timing(builder, 'builder.output');
      assert.ok(endTime(outputTiming) >= successEnd);
      assert.ok(endTime(total) <= reportStart);
      const report = await readFile(join(root, 'reports/build.md'), 'utf8');
      assert.match(report, /# 构建性能报告/);
      assert.match(report, /构建状态：成功/);
      assert.match(report, /构建总耗时/);
      assert.match(report, /## 构建阶段/);
      assert.match(report, /## 完整插件数据/);
    }
    finally {
      await builder.stop();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('失败报告保留已完成阶段，不记录未结束阶段，下一轮不残留失败数据', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-timing-failure-'));
    const builder = controlledBuilder(root);
    builder.options.debug = true;
    builder.options.reportFile = 'build.md';
    let shouldFail = true;
    let failureHandled = 0;
    builder.hooks.afterRunner.tapPromise('test-failure', async () => {
      if (shouldFail) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('expected timing failure');
      }
    });
    builder.hooks.failed.tap('test-failure-handled', () => {
      failureHandled = performance.now();
    });
    Interceptor().apply(builder);
    try {
      await builder.build();
      assert.equal(builder.getErrors().length, 1);
      assert.ok(timing(builder, 'builder.bundle').duration >= 0);
      assert.ok(timing(builder, 'builder.total').duration > 0);
      assert.ok(endTime(timing(builder, 'builder.total')) >= failureHandled);
      assert.deepEqual(builder.getTimings().map((item) => item.name), ['builder.bundle', 'builder.total']);
      assert.match(await readFile(join(root, 'build.md'), 'utf8'), /构建状态：失败/);

      shouldFail = false;
      await builder.build();
      assert.deepEqual(builder.getErrors(), []);
      assert.deepEqual(builder.getTimings().map((item) => item.name), [
        'builder.bundle',
        'builder.generate',
        'builder.output',
        'builder.total',
      ]);
      assert.match(await readFile(join(root, 'build.md'), 'utf8'), /构建状态：成功/);
    }
    finally {
      await builder.stop();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('报告写入失败后释放构建状态，修正路径后可以再次构建', async function () {
    this.timeout(5000);
    const root = await mkdtemp(join(tmpdir(), 'blog-timing-report-failure-'));
    const builder = controlledBuilder(root);
    builder.options.debug = true;
    builder.options.reportFile = 'blocked/report.md';
    let rounds = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    builder.hooks.start.tap('count-builds', () => rounds++);
    Interceptor().apply(builder);
    try {
      await writeFile(join(root, 'blocked'), 'existing file');
      await assert.rejects(builder.build(), (error: NodeJS.ErrnoException) =>
        error.code === 'EEXIST' || error.code === 'ENOTDIR',
      );
      assert.equal(await readFile(join(root, 'blocked'), 'utf8'), 'existing file');

      builder.options.reportFile = 'reports/build.md';
      await Promise.race([
        builder.build(),
        new Promise<void>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('报告写入失败后构建状态未释放')), 1000);
        }),
      ]);
      assert.equal(rounds, 2);
      assert.match(await readFile(join(root, 'reports/build.md'), 'utf8'), /构建状态：成功/);
      assert.equal(builder.getTimings().filter((item) => item.name === 'builder.total').length, 1);
    }
    finally {
      clearTimeout(timeout);
      await builder.stop();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('资源处理抛错后省略未完成的输出阶段，保留前两阶段并完成总计', async () => {
    const builder = controlledBuilder();
    let failedCalls = 0;
    let successCalls = 0;
    let failureHandled = 0;
    builder.hooks.processAssets.tapPromise('reject-asset-processing', async () => {
      throw new Error('expected asset processing failure');
    });
    builder.hooks.failed.tap('count-asset-failure', () => {
      failedCalls++;
      failureHandled = performance.now();
    });
    builder.hooks.success.tap('count-success', () => successCalls++);
    try {
      await builder.build();
      assert.equal(failedCalls, 1);
      assert.equal(successCalls, 0);
      assert.equal(builder.getErrors().length, 1);
      assert.deepEqual(builder.getTimings().map((item) => item.name), [
        'builder.bundle',
        'builder.generate',
        'builder.total',
      ]);
      assert.ok(endTime(timing(builder, 'builder.total')) >= failureHandled);
    }
    finally {
      await builder.stop();
    }
  });

  for (const { debug, existing } of [
    { debug: false, existing: false },
    { debug: false, existing: true },
    { debug: true, existing: false },
  ]) {
    it(`reportFile 仅在 debug 开启时输出，debug=${debug}，已有报告=${existing}`, async function () {
      this.timeout(15000);
      const root = await mkdtemp(join(tmpdir(), 'blog-timing-integration-'));
      const entry = join(root, 'entry.ts');
      const reportPath = join(root, 'reports/build.md');
      const messages: string[] = [];
      const runtime = resolve(__dirname, '../../../context/src/runtime/index.ts').replaceAll('\\', '/');
      const builder = new Builder({
        root,
        entry,
        debug,
        reportFile: debug ? reportPath : 'reports/build.md',
        write: true,
        mode: 'development',
        logLevel: 'Silence',
        typeCheck: false,
        plugins: [
          {
            name: 'report-test-plugin',
            apply(instance) {
              instance.hooks.beforeBundler.tap('report-test-plugin', () => {});
            },
          },
        ],
      });
      builder.logger.info = (...items) => messages.push(...items);
      try {
        if (existing) {
          await mkdir(join(root, 'reports'));
          await writeFile(reportPath, 'existing report');
        }

        await writeFile(entry, `
import { Builder } from ${JSON.stringify(runtime)};
export default async () => {
  const end = Builder.startMeasure('fixture.runtime');
  const assets = [{ path: 'index.html', content: Buffer.from('runtime output') }];
  end();
  return assets;
};
`);
        await builder.init();
        await builder.build();
        assert.deepEqual(builder.getErrors(), []);
        assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), 'runtime output');
        assert.ok(timing(builder, 'fixture.runtime').duration >= 0, '运行时代理将计时写入宿主 Builder');
        assert.equal(messages.some((message) => message.includes('构建性能报告')), debug);

        if (debug) {
          const report = await readFile(reportPath, 'utf8');
          assert.match(report, /构建状态：成功/);
          assert.match(report, /fixture\.runtime/);
          assert.match(report, /## 完整插件数据/);
          assert.match(report, /report-test-plugin/);
        }
        else {
          if (existing) {
            assert.equal(await readFile(reportPath, 'utf8'), 'existing report', '普通构建不覆盖旧报告');
          }
          else {
            await assert.rejects(readFile(reportPath, 'utf8'), (error: NodeJS.ErrnoException) => error.code === 'ENOENT');
          }
        }
      }
      finally {
        await builder.stop();
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  it('报告只展示三个外层阶段与四个页面生成步骤，不重复展示小计或细碎钩子', () => {
    const report = getBuildReport([
      { name: 'builder.bundle', startTime: 0, duration: 5 },
      { name: 'builder.generate', startTime: 5, duration: 20 },
      { name: 'generator.prepare', startTime: 5, duration: 2 },
      { name: 'generator.preRender', startTime: 7, duration: 3 },
      { name: 'generator.beforeBuild', startTime: 10, duration: 10 },
      { name: 'generator.render', startTime: 20, duration: 5 },
      { name: 'builder.output', startTime: 25, duration: 5 },
      { name: 'builder.total', startTime: 0, duration: 30 },
    ], { failed: false });
    assert.match(report, /## 页面生成内部步骤/);
    const rows = report.split('\n').filter((line) => /^\|[^:]/.test(line) && !line.startsWith('|阶段|'));
    assert.deepEqual(rows, [
      '|代码打包与检查|5 ms|',
      '|页面生成|20 ms|',
      '|资源收尾与写入|5 ms|',
      '|页面准备|2 ms|',
      '|预渲染|3 ms|',
      '|构建前处理|10 ms|',
      '|正式渲染与收尾|5 ms|',
    ]);
    assert.doesNotMatch(report, /小计|等待运行时初始化|生成器开始钩子|加载生成器|构建开始钩子|\|字体构建\|/);
    assert.match(report, /包含/);
  });
});
