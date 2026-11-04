import { useRenderContext } from '@blog/context/runtime';
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
      <button
        className={styles.classes.play}
        type="button"
        aria-label="播放（全屏）"
        title="播放（全屏）"
      >
        <svg
          width="20"
          height="20"
          viewBox="2 2 20 20"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M10 8.5v7l6-3.5z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
