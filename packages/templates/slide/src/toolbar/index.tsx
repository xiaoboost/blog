import { useRenderContext } from '@blog/context/runtime';
import { Export, ProgressRing, Play } from '@blog/icons';
import { PrimaryTitleFont } from '@blog/styles';
import styles from './index.jss';

interface ToolbarProps {
  title: string;
  showPageNumber: boolean;
}

export function Toolbar({ title, showPageNumber }: ToolbarProps) {
  const { page } = useRenderContext();
  const titleFont = page.getFontBucket(PrimaryTitleFont.fontFamily);

  return (
    <div className={styles.classes.toolbar}>
      <span className={`${styles.classes.title} ${titleFont.getClassName()}`} title={title}>{title}</span>
      {showPageNumber && (
        <>
          <span className={styles.classes.counter} aria-live="polite" aria-atomic="true">
            <input
              className={styles.classes.currentPage}
              type="text"
              inputMode="numeric"
              enterKeyHint="go"
              aria-label="当前页码，输入后按回车跳转"
              title="输入页码，按回车跳转"
              defaultValue="—"
              disabled
            />
            <span> / </span>
            <span className={styles.classes.totalPages}>—</span>
          </span>
          <span className={styles.classes.divider} aria-hidden="true" />
        </>
      )}
      <div className={styles.classes.actions}>
        <button
          className={`${styles.classes.button} ${styles.classes.export}`}
          type="button"
          aria-label="导出"
          title="导出"
        >
          <Export className={styles.classes.exportIcon} width="18" height="18" />
          <ProgressRing className={styles.classes.exportProgress} width="18" height="18" />
        </button>
        <button
          className={`${styles.classes.button} ${styles.classes.play}`}
          type="button"
          aria-label="播放（全屏）"
          title="播放（全屏）"
        >
          <Play width="20" height="20" />
        </button>
      </div>
    </div>
  );
}
