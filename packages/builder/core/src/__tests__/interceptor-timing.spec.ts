import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { describe, it } from 'mocha';
import { AsyncSeriesWaterfallHook, SyncWaterfallHook } from 'tapable';
import { getMdString } from '../plugins/interceptor/hooks/hook';
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

    assert.match(report, /\|short\|Builder\|work\|1\|< 1 ms\|1\.23 ms\|/);
    assert.match(report, /\|long\|Builder\|work\|1\|1 s\|1000 s\|/);
    assert.match(report, /插件活跃总时间: 1000 s/);
    assert.doesNotMatch(report, /undefined|NaN/);
    assert.equal(summary.items[0].avgCost, 0.0625, '展示舍入不改动原始数据');
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
