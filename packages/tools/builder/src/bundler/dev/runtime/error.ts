import { hmrLog } from './utils';

const errorElementId = 'blog-error';

export function showError(errors: string[]) {
  if (errors.length === 0) {
    return;
  }

  hmrLog(`Show error`);

  const div = document.createElement('div');
  const children = errors
    .map((error) => `<pre class="pre" style="word-break: break-all;">${error}</pre>`)
    .join('<br/><br/><br/><br/>');

  div.innerHTML = `<div>${children}</div>`;
  div.id = errorElementId;
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.right = '0';
  div.style.bottom = '0';
  div.style.left = '0';
  div.style.zIndex = '9999';
  div.style.background = '#000';
  div.style.padding = '50px';
  div.style.fontSize = '16px';
  div.style.color = '#fff';
  div.style.overflowX = 'scroll';

  div.addEventListener('click', () => document.body.removeChild(div));
  document.body.appendChild(div);
}

export function closeError() {
  const div = document.getElementById(errorElementId);

  if (div) {
    hmrLog('Clear error');
    document.body.removeChild(div);
  }
}
