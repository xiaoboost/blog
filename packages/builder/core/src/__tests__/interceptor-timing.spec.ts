import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { describe, it } from 'mocha';
import { AsyncSeriesBailHook, AsyncSeriesWaterfallHook, SyncWaterfallHook } from 'tapable';
import { getMdString, print } from '../plugins/interceptor/hooks/hook';
import type { AllPluginData, HookSummary } from '../plugins/interceptor/hooks/types';
import { getHookData, interceptHookMap } from '../plugins/interceptor/hooks/utils';

describe('插件计时的毫秒统计', () => {
  it('保留小数毫秒，分别计算调用平均值、单钩子并集和全部钩子并集', () => {
    const data: AllPluginData = new Map([
      [
        'first',
        new Map([
          [
            'Builder',
            new Map([
              [
                'work',
                [
                  { startAt: 2.5, endAt: 2.625 },
                  { startAt: 1.5, endAt: 2.125 },
                  { startAt: 1.125, endAt: 1.75 },
                ],
              ],
            ]),
          ],
        ]),
      ],
      [
        'second',
        new Map([
          [
            'Builder',
            new Map([
              [
                'work',
                [
                  { startAt: 1.25, endAt: 1.375 },
                  { startAt: 2, endAt: 2.75 },
                ],
              ],
            ]),
          ],
        ]),
      ],
    ]);
    const before = structuredClone(data);
    const summary = getHookData(data);

    assert.equal(summary.items[0].count, 3);
    assert.equal(summary.items[0].avgCost, 1.375 / 3);
    assert.equal(summary.items[0].totalCost, 1.125);
    assert.equal(summary.items[1].avgCost, 0.4375);
    assert.equal(summary.items[1].totalCost, 0.875);
    assert.equal(summary.globalTotalCost, 1.625);
    assert.equal(summary.items[0].effectiveCount, undefined);
    assert.equal(summary.items[0].effectiveAvgCost, undefined);
    assert.deepEqual(data, before, '统计时排序副本，不修改原始区间');
  });

  it('没有记录时返回数字零', () => {
    assert.deepEqual(getHookData(new Map()), { items: [], globalTotalCost: 0 });
  });

  it('Markdown 直接格式化毫秒，长于一千秒仍保留有效单位', () => {
    const summary: HookSummary = {
      globalTotalCost: 1_000_500.25,
      items: [
        {
          pluginName: 'short',
          mapName: 'Builder',
          tapName: 'work',
          count: 1,
          avgCost: 0.0625,
          totalCost: 1.23456,
        },
        {
          pluginName: 'long',
          mapName: 'Builder',
          tapName: 'work',
          count: 1,
          avgCost: 1000,
          totalCost: 1_000_500.25,
        },
      ],
    };
    const report = getMdString(summary);

    assert.match(report, /\|short\|Builder\|work\|— \/ 1\|< 1 ms\|—\|1\.23 ms\|/);
    assert.match(report, /\|long\|Builder\|work\|— \/ 1\|1 s\|—\|1000 s\|/);
    assert.match(report, /插件活跃总时间 1000 s/);
    assert.doesNotMatch(report, /undefined|NaN/);
    assert.equal(summary.items[0].avgCost, 0.0625, '展示舍入不改动原始数据');
  });

  it('有效平均只使用有效调用，未生效调用仍计入全部次数和活跃时间', () => {
    const data: AllPluginData = new Map([
      [
        'fixture',
        new Map([
          [
            'Bundler',
            new Map([
              [
                'load',
                [
                  { startAt: 0, endAt: 8, effective: true },
                  { startAt: 2, endAt: 4, effective: false },
                  { startAt: 4, endAt: 8, effective: true },
                ],
              ],
              ['resolve', [{ startAt: 9, endAt: 10, effective: false }]],
            ]),
          ],
        ]),
      ],
    ]);
    const summary = getHookData(data);
    const [load, resolve] = summary.items;
    assert.equal(load.count, 3);
    assert.equal(load.effectiveCount, 2);
    assert.equal(load.avgCost, 14 / 3);
    assert.equal(load.effectiveAvgCost, 6);
    assert.equal(load.totalCost, 8);
    assert.equal(resolve.effectiveCount, 0);
    assert.equal(resolve.effectiveAvgCost, undefined);
    assert.equal(summary.globalTotalCost, 9);

    const report = getMdString(summary);
    assert.match(report, /\|fixture\|Bundler\|load\|2 \/ 3\|4\.67 ms\|6 ms\|8 ms\|/);
    assert.match(report, /\|fixture\|Bundler\|resolve\|0 \/ 1\|1 ms\|—\|1 ms\|/);
    const ranking = report.split('## 平均有效处理耗时最多')[1].split('## 完整插件数据')[0];
    assert.match(ranking, /\|fixture\|Bundler\|load\|2\|6 ms\|/);
    assert.doesNotMatch(ranking, /resolve/);
  });

  it('resolve 和 load 按最终返回值计数，空内容和错误结果也属于提供了结果', async () => {
    const data: AllPluginData = new Map();
    const resolve = new AsyncSeriesBailHook<[unknown], unknown>(['result']);
    const load = new AsyncSeriesBailHook<[unknown], unknown>(['result']);
    resolve.tap('resolver', (result) => result);
    load.tapPromise('loader', async (result) => result);
    interceptHookMap('Bundler', { resolve, load }, {}, data);
    const results = [
      undefined,
      null,
      { contents: '' },
      { errors: [{ text: 'failed' }] },
    ];

    for (const result of results) {
      assert.equal(await resolve.promise(result), result);
      assert.equal(await load.promise(result), result);
    }

    for (const item of getHookData(data).items) {
      assert.equal(item.count, 4);
      assert.equal(item.effectiveCount, 2);
    }
  });

  it('并发 waterfall 调用使用每个插件自己的输入引用，兼容三种 tap', async () => {
    const data: AllPluginData = new Map();
    const transform = new AsyncSeriesWaterfallHook<[{ value: number }]>(['input']);
    transform.tap('sync', (input) => input.value === 1 ? { ...input } : input);
    transform.tapPromise('promise-pass', async (input) => input);
    transform.tapAsync('callback-undefined', (_input, callback) => callback(null));
    transform.tapAsync('callback', (input, callback) => {
      queueMicrotask(() => callback(null, input.value === 1 ? { value: 3 } : input));
    });
    interceptHookMap('Bundler', { transform }, {}, data);
    const skipped = { value: 2 };
    const [changed, untouched] = await Promise.all(
      [transform.promise({ value: 1 }), transform.promise(skipped)],
    );
    assert.deepEqual(changed, { value: 3 });
    assert.equal(untouched, skipped);
    const counts = getHookData(data).items.map((item) =>
      [item.pluginName, item.count, item.effectiveCount],
    );
    assert.deepEqual(counts, [
      ['sync', 2, 1],
      ['promise-pass', 2, 0],
      ['callback-undefined', 2, 0],
      ['callback', 2, 1],
    ]);
  });

  it('processAssets 采用新引用判据，initialization 保留普通调用统计', async () => {
    const data: AllPluginData = new Map();
    const processAssets = new AsyncSeriesWaterfallHook<[string[]]>(['assets']);
    const initialization = new SyncWaterfallHook<[object]>(['options']);
    processAssets.tap('append', (assets) => [...assets, 'new']);
    processAssets.tap('pass', (assets) => assets);
    initialization.tap('configure', (options) => options);
    interceptHookMap('Builder', { processAssets }, {}, data);
    interceptHookMap('Bundler', { initialization }, {}, data);
    assert.deepEqual(await processAssets.promise([]), ['new']);
    initialization.call({});
    assert.deepEqual(getHookData(data).items.map((item) => item.effectiveCount), [1, 0, undefined]);
  });

  it('有效排行按有效平均排序，终端和 Markdown 都显示两个排行及完整明细', () => {
    const summary: HookSummary = {
      globalTotalCost: 200,
      items: [
        {
          pluginName: 'many-skips',
          mapName: 'Bundler',
          tapName: 'load',
          count: 100,
          effectiveCount: 1,
          avgCost: 1,
          effectiveAvgCost: 100,
          totalCost: 100,
        },
        {
          pluginName: 'all-handled',
          mapName: 'Bundler',
          tapName: 'load',
          count: 2,
          effectiveCount: 2,
          avgCost: 50,
          effectiveAvgCost: 50,
          totalCost: 100,
        },
        {
          pluginName: 'ordinary',
          mapName: 'Builder',
          tapName: 'start',
          count: 1,
          avgCost: 200,
          totalCost: 200,
        },
      ],
    };
    const report = getMdString(summary);
    const ranking = report.split('## 平均有效处理耗时最多')[1].split('## 完整插件数据')[0];
    assert.ok(ranking.indexOf('many-skips') < ranking.indexOf('all-handled'));
    assert.doesNotMatch(ranking, /ordinary/);
    const output: string[] = [];
    const logger: Parameters<typeof print>[0] = {
      info: (message) => output.push(message),
      debug: () => {},
      error: () => {},
    };
    print(logger, summary);
    print(logger, { items: [], globalTotalCost: 0 });
    for (const title of ['活跃时间最多', '平均有效处理耗时最多', '完整插件数据']) {
      assert.ok(report.includes(title));
      assert.ok(output.every((text) => text.includes(title)));
    }
    assert.doesNotMatch(report + output.join('\n'), /平均调用耗时最多/);
    assert.match(output[0], /1 \/ 100/);
    assert.match(output[0], /— \/ 1/);
    assert.doesNotMatch(output.join('\n'), /undefined|NaN/);
  });

  it('失败调用保留次数和耗时，callback 报错与同步抛错都只记录一次', async () => {
    const data: AllPluginData = new Map();
    const failure = new Error('expected failure');
    const load = new AsyncSeriesBailHook<[string], unknown>(['kind']);
    load.tapAsync('callback', (kind, callback) => {
      if (kind === 'throw') {
        throw failure;
      }

      callback(failure);
    });
    interceptHookMap('Bundler', { load }, {}, data);
    await assert.rejects(load.promise('callback'), (error) => error === failure);
    await assert.rejects(load.promise('throw'), (error) => error === failure);
    const summary = getHookData(data);
    assert.equal(summary.items[0].count, 2);
    assert.equal(summary.items[0].effectiveCount, 0);
    assert.equal(summary.items[0].effectiveAvgCost, undefined);
    assert.ok(summary.items[0].totalCost >= 0);
  });

  it('同步、Promise 和 callback 钩子保留返回值，记录同一毫秒时钟上的区间', async () => {
    const data: AllPluginData = new Map();
    const sync = new SyncWaterfallHook<[number]>(['value']);
    const async = new AsyncSeriesWaterfallHook<[number]>(['value']);
    sync.tap('sync', (value) => value + 1);
    async.tapPromise('promise', async (value) => value + 2);
    async.tapAsync('callback', (value, callback) => callback(null, value + 3));
    interceptHookMap('Test', { sync, async }, {}, data);

    const before = performance.now();
    assert.equal(sync.call(1), 2);
    assert.equal(await async.promise(1), 6);
    const after = performance.now();

    for (const [plugin, hook] of [['sync', 'sync'], ['promise', 'async'], ['callback', 'async']]) {
      const intervals = data.get(plugin)?.get('Test')?.get(hook);
      assert.equal(intervals?.length, 1);
      const interval = intervals![0];
      assert.equal(typeof interval.startAt, 'number');
      assert.equal(typeof interval.endAt, 'number');
      assert.ok(interval.startAt >= before);
      assert.ok(interval.endAt >= interval.startAt);
      assert.ok(interval.endAt <= after);
    }
  });

  it('同步异常与 Promise 拒绝保持原错误，并留下已执行区间', async () => {
    const data: AllPluginData = new Map();
    const sync = new SyncWaterfallHook<[number]>(['value']);
    const async = new AsyncSeriesWaterfallHook<[number]>(['value']);
    const failure = new Error('timing fixture');
    sync.tap('sync-failure', () => {
      throw failure;
    });
    async.tapPromise('promise-failure', async () => {
      throw failure;
    });
    interceptHookMap('Test', { sync, async }, {}, data);

    assert.throws(() => sync.call(1), (error) => error === failure);
    await assert.rejects(async.promise(1), (error) => error === failure);
    const summary = getHookData(data);
    assert.equal(summary.items.length, 2);
    assert.ok(summary.items.every((item) => item.count === 1 && item.totalCost >= 0));
  });
});
