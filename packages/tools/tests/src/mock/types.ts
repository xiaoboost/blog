export type AssertFunc = (val: string) => boolean;

export type MockPath = string | RegExp | AssertFunc;

export interface MockExport {
  /** 原始匹配参数 */
  path: MockPath;
  /** 匹配函数 */
  assert: AssertFunc;
  /** 导出对象 */
  export: any;
}
