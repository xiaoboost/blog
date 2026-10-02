import './theme/style.jss';
import { ModuleLoader, assets } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';
import { copyCode } from './copy';
import styles from './index.jss';

function active() {
  const controller = new AbortController();
  const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>();
  const pending = new WeakSet<HTMLButtonElement>();
  const buttons = document.querySelectorAll<HTMLButtonElement>(`.${styles.classes.codeBlockCopy}`);

  function setStatus(button: HTMLButtonElement, state: 'idle' | 'success' | 'error') {
    const message = {
      idle: '',
      success: '代码已复制',
      error: '复制失败，请手动选择代码复制',
    }[state];
    const status = button.querySelector(`.${styles.classes.codeBlockCopyStatus}`);

    button.dataset.copyState = state;
    button.title = message || '复制代码';
    if (status) {
      status.textContent = message;
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.getAttribute('data-copy-code');
      if (code === null || pending.has(button)) return;

      pending.add(button);
      clearTimeout(timers.get(button));

      try {
        await copyCode(code);
        if (!controller.signal.aborted) setStatus(button, 'success');
      }
      catch {
        if (!controller.signal.aborted) setStatus(button, 'error');
      }
      finally {
        pending.delete(button);
      }

      if (!controller.signal.aborted) {
        timers.set(button, setTimeout(() => {
          setStatus(button, 'idle');
          timers.delete(button);
        }, 2000));
      }
    }, { signal: controller.signal });
  });

  return () => {
    controller.abort();
    timers.forEach((timer, button) => {
      clearTimeout(timer);
      setStatus(button, 'idle');
    });
    timers.clear();
  };
}

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
}
else {
  active();
}

export default assets;
