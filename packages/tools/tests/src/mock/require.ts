import Module from 'module';
import { isString } from '@xiao-ai/utils';
import { getFullPath } from './utils';
import { getExport } from './exports';

const originalLoader: (...rest: any[]) => any = (Module as any)._load;
const self = this;

export function active() {
  (Module as any)._load = (request: string, parent: NodeModule, ...rest: any[]) => {
    if (!parent) {
      return originalLoader.apply(self, [request, parent, ...rest]);
    }

    const fullFilePath = getFullPath(request, parent.filename);
    const mockResult = getExport(fullFilePath);

    if (mockResult) {
      console.log('⚡ ==== mockResult', mockResult);
      if (isString(mockResult.export)) {
        return require(mockResult.export);
      } else {
        return mockResult.export;
      }
    } else {
      return originalLoader.apply(self, [request, parent, ...rest]);
    }
  };
}

export function unActive() {
  (Module as any)._load = originalLoader;
}
