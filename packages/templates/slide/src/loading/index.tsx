import React from 'react';
import styles from './index.jss';

export function Loading() {
  return (
    <div className={styles.classes.loading} role="status" aria-label="正在加载幻灯片">
      <span className={styles.classes.spinner} />
    </div>
  );
}

export function LoadingError() {
  return (
    <div className={styles.classes.error} role="status" hidden>
      <svg
        className={styles.classes.errorIcon}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5" strokeLinecap="round" />
        <circle
          cx="12"
          cy="16"
          r=".75"
          fill="currentColor"
          stroke="none"
        />
      </svg>
      <div className={styles.classes.errorMessage}>
        <strong>动画加载失败</strong>
        <span>仍可继续翻页</span>
      </div>
      <button className={styles.classes.retry} type="button">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6v5h-5M19.1 8a8 8 0 1 0 .9 7" />
        </svg>
        刷新重试
      </button>
    </div>
  );
}
