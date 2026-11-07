export interface SlideExportOptions {
  canvas: HTMLElement;
  title: string;
  signal: AbortSignal;
  /** 已写入 PDF 的页数和总页数。 */
  onProgress?: (completed: number, total: number) => void;
}

export interface SlideExportModule {
  exportPdf(options: SlideExportOptions): Promise<void>;
}
