import { ModuleLoader, assets } from '@blog/context/web';
import { DURATION_NORMAL } from '@blog/styles';
import { getCurrentScriptSrc } from '@blog/web';
import styles from './index.jss';
import { createInlineReveal } from './reveal';

const { classes } = styles;

function active() {
  const list = document.querySelectorAll<HTMLElement>(
    `.${classes.glossWrapper} .${classes.glossContent}`,
  );
  const cleanup: (() => void)[] = [];

  list.forEach((el) => {
    const wrapper = el.closest<HTMLElement>(`.${classes.glossWrapper}`);
    const description = wrapper?.querySelector<HTMLElement>(`.${classes.glossDescription}`);

    if (!wrapper || !description) {
      throw new Error('[TextGloss Error]: 未能发现正确的文字夹注组件结构');
    }

    let frame: number | undefined;
    let reveal: ReturnType<typeof createInlineReveal> | undefined;
    let distance = 0;

    const finish = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      reveal?.dispose();
      reveal = undefined;
      wrapper.classList.remove(classes.glossAnimating, classes.glossClosing);
    };

    const handler = () => {
      const expanded = el.getAttribute('aria-expanded') !== 'true';
      if (frame !== undefined) cancelAnimationFrame(frame);
      wrapper.classList.toggle(classes.glossActive, expanded);
      wrapper.classList.toggle(classes.glossClosing, !expanded);
      el.setAttribute('aria-expanded', String(expanded));
      description.setAttribute('aria-hidden', String(!expanded));
      description.toggleAttribute('inert', !expanded);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
      }

      if (!reveal) {
        reveal = createInlineReveal(description, classes);
        distance = expanded ? 0 : reveal.total;
        wrapper.classList.add(classes.glossAnimating);
      }
      const from = distance;
      const to = expanded ? reveal.total : 0;
      const duration = DURATION_NORMAL * 1000 * Math.abs(to - from) / reveal.total;
      if (!duration) {
        finish();
        return;
      }
      reveal.render(distance);
      const started = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        distance = from + (to - from) * eased;
        reveal!.render(distance);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      };
      frame = requestAnimationFrame(tick);
    };

    // HMR 重新绑定时也保持展开状态与可访问性属性一致。
    description.toggleAttribute('inert', el.getAttribute('aria-expanded') !== 'true');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== el || (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }
      event.preventDefault();
      if (!event.repeat) {
        handler();
      }
    };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', onKeyDown);
    cleanup.push(() => {
      el.removeEventListener('click', handler);
      el.removeEventListener('keydown', onKeyDown);
      finish();
    });
  });

  return () => {
    cleanup.forEach((dispose) => dispose());
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
