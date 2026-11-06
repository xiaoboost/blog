import { loadResource } from '@blog/context/web';
import { SlideExportScript } from '../export/constant';
import type { SlideExportModule } from '../export/types';
import toolbarStyles from '../toolbar/index.jss';

export function bindExport(button: HTMLButtonElement, canvas: HTMLElement, signal: AbortSignal) {
  const spinner = button.querySelector<SVGElement>(`.${toolbarStyles.classes.exportProgress} svg`)!;
  const progress = spinner.querySelector<SVGCircleElement>('circle[pathLength]')!;
  button.addEventListener('click', async () => {
    progress.setAttribute('stroke-dashoffset', '75');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-label', '正在导出');
    button.title = '正在加载导出功能…';
    const animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? undefined
      : spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
        duration: 800,
        iterations: Infinity,
      });

    try {
      const exporter = await loadResource<SlideExportModule>(SlideExportScript, signal);
      signal.throwIfAborted();
      button.title = '正在导出…';
      await exporter.exportPpt({
        canvas,
        title: canvas.closest('article')?.getAttribute('aria-label') || document.title,
        signal,
        onProgress: (completed, total) => {
          animation?.cancel();
          progress.setAttribute('stroke-dashoffset', String(100 * (1 - completed / total)));
          button.title = completed === total
            ? '正在保存 PDF…'
            : `正在导出 ${completed} / ${total}（${Math.round(completed / total * 100)}%）…`;
          button.setAttribute('aria-label', button.title);
        },
      });
      button.title = '导出';
    }
    catch (error) {
      if (!signal.aborted) {
        button.title = `${error instanceof Error ? error.message : '导出失败'}，点击重试`;
        console.error('[slide] 导出失败。', error);
      }
    }
    finally {
      animation?.cancel();
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.setAttribute('aria-label', '导出');
    }
  }, { signal });
}
