import { HMRUpdate, HMRUpdateKind } from './types';

type FileInput = string | undefined | null | Buffer;

export function isFileEqual(file1: FileInput, file2: FileInput): boolean {
  if (!file1 || !file2) {
    return false;
  }

  if (!file1 || !file2) {
    return false;
  } else if (typeof file1 === 'string' && typeof file2 === 'string') {
    return file1 === file2;
  } else if (Buffer.isBuffer(file1) && Buffer.isBuffer(file2)) {
    return file1.equals(file2);
  } else {
    throw new Error('文件类型错误');
  }
}

export function getHtmlDiff(html1: string, html2: string, path: string): HMRUpdate[] {
  const bodyMatcher = /(<body>[\d\D]*<\/body>)<\/html>/;
  const body1 = bodyMatcher.exec(html1);
  const body2 = bodyMatcher.exec(html2);

  if (!body1 || !body2 || body1[1] === body2[1]) {
    return [];
  }

  return [
    {
      kind: HMRUpdateKind.HTML,
      path,
      selector: 'body',
      content: body2[1],
    },
  ];
}
