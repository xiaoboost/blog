import { SlideWidth, SlideHeight } from '@blog/mdx-slide/shared';
import { snapdom } from '@zumer/snapdom';
import { jsPDF } from 'jspdf';
import { createExportFrame, waitForExportFrame } from './frame';
import type { SlideExportOptions } from './types';

export async function exportPdf({
  canvas,
  title,
  signal,
  onProgress,
}: SlideExportOptions) {
  const sections = Array.from(canvas.querySelectorAll<HTMLElement>('[data-slide-section]'));

  if (!sections.length) {
    throw new Error('没有可以导出的幻灯片。');
  }

  const width = SlideWidth * 0.75;
  const height = SlideHeight * 0.75;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [width, height],
    compress: true,
  });
  pdf.setProperties({ title });
  onProgress?.(0, sections.length);

  for (const [index, section] of sections.entries()) {
    signal.throwIfAborted();
    const frame = createExportFrame(canvas, section);
    let image: HTMLCanvasElement | undefined;
    try {
      await waitForExportFrame(frame, signal);
      const capture = await snapdom(frame, {
        width: SlideWidth,
        height: SlideHeight,
        dpr: 1,
        embedFonts: true,
        fast: false,
      });
      signal.throwIfAborted();
      image = await capture.toCanvas();
      signal.throwIfAborted();

      if (index > 0) {
        pdf.addPage([width, height], 'landscape');
      }

      pdf.addImage(image.toDataURL('image/png'), 'PNG', 0, 0, width, height);
      onProgress?.(index + 1, sections.length);
    }
    catch (error) {
      signal.throwIfAborted();
      throw new Error(`第 ${index + 1} 页导出失败：${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    finally {
      frame.remove();

      if (image) {
        image.width = 0;
        image.height = 0;
      }
    }
  }

  signal.throwIfAborted();
  const filename = Array.from(title, (char) => char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char)
    .join('').replace(/[. ]+$/, '').trim() || 'slides';
  await pdf.save(`${filename}.pdf`, { returnPromise: true });
}
