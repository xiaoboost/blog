export function Index() {
  return '';
}

function fixHtml<T extends string | Buffer>(content: T): T {
  const prefix = '<!DOCTYPE html>';
  // const isStr = isString(content);
  // const data = isStr ? content : content.toString();
  // const fixed = data.indexOf(prefix) === 0 ? data : prefix + data;

  // return (isStr ? fixed : Buffer.from(fixed)) as T;
}
