/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-empty-interface */

export type AnyObject<T = any> = Record<string, T>;
export type AnyFunction = (...args: any[]) => any;
export type EmptyObject = Record<string, never>;
export type Empty = {};

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends AnyFunction
    ? T
    : T extends AnyObject
      ? DeepReadonlyObject<T>
      : T;

export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/** 文章元数据 */
export interface PostData {
  title: string;
  create: number;
  update: number;
  tags: string[];
  html: string;
  htmlTitle: string;
  public: boolean;
  content: string;
  description: string;
}
