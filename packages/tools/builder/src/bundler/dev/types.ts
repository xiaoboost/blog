/** HMR 更新类别 */
export enum HMRKind {
  Update,
  Reload,
  Error,
}

/** HMR 更新数据类别 */
export enum HMRUpdateKind {
  CSS,
  HTML,
}

/** HMR 更新数据 */
export type HMRUpdate =
  | {
      kind: HMRUpdateKind.CSS;
      path: string;
    }
  | {
      kind: HMRUpdateKind.HTML;
      path: string;
      selector: string;
      content: string;
    };

/** HMR 数据 */
export type HMRData =
  | {
      kind: HMRKind.Reload;
    }
  | {
      kind: HMRKind.Error;
      errors: string[];
    }
  | {
      kind: HMRKind.Update;
      updates: HMRUpdate[];
    };

/** 服务器选项 */
export interface ServerOption {
  /**
   * 监听端口
   *
   * @default 6060
   */
  port?: number;
  /**
   * 是否启用 HMR 功能
   *
   * @default true
   */
  hmr?: boolean;
}
