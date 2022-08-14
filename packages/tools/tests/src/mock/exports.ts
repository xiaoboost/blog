import { isString, remove } from '@xiao-ai/utils';
import getCallerFile from 'get-caller-file';
import { MockExport, MockPath } from './types';
import { getFullPath } from './utils';

const mockExports: MockExport[] = [];

export function clear() {
  mockExports.length = 0;
}

export function addExport(path: MockPath, mockExport: any) {
  if (isString(path)) {
    const fullPath = getFullPath(path, getCallerFile());
    mockExports.push({
      path,
      assert: (val: string) => val === fullPath,
      export: mockExport,
    });
  } else if (path instanceof RegExp) {
    mockExports.push({
      path,
      assert: (val: string) => path.test(val),
      export: mockExport,
    });
  } else {
    mockExports.push({
      path,
      assert: path,
      export: mockExport,
    });
  }
}

export function getExport(path: string) {
  return mockExports.find((item) => item.assert(path));
}

export function removeExport(path: MockPath) {
  remove(mockExports, (item) => item.path === path);
}
