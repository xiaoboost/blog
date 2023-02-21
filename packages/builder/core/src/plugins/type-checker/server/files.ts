import type * as ts from 'typescript';
import { getScriptSnapshot } from './utils';

export interface FileData {
  /** 文件版本 */
  version: number;
  /** 文件代码快照 */
  snapshot: ts.IScriptSnapshot;
}

/** 文件缓存 */
export class FileMemory extends Map<string, FileData> {
  getNames() {
    return Array.from(this.keys());
  }

  getVersion(file: string) {
    return this.get(file)?.version ?? 0;
  }

  getSnapshot(file: string) {
    return this.get(file)?.snapshot;
  }

  setScript(file: string, code: string) {
    if (!this.has(file)) {
      this.set(file, {
        version: 1,
        snapshot: getScriptSnapshot(code),
      });
    } else {
      const oldData = this.get(file)!;
      const oldCode = oldData.snapshot.getText(0, Infinity);

      if (oldCode !== code) {
        this.set(file, {
          version: ++oldData.version,
          snapshot: getScriptSnapshot(code),
        });
      }
    }
  }
}
