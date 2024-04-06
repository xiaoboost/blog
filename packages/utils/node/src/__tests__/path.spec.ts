import { expect, describe, it } from '@blog/test-toolkit';
import { platform } from 'process';
import { isRootDirectory } from '../path';

describe('path', () => {
  it('isRootDirectory', async () => {
    if (platform === 'win32') {
      expect(isRootDirectory('C:/')).true;
      expect(isRootDirectory('D:/')).true;
      expect(isRootDirectory('C:/test/tmp')).false;
    } else {
      expect(isRootDirectory('/')).true;
      expect(isRootDirectory('/test/tmp')).false;
    }
  });
});
