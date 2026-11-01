import { stringifyClass } from '@xiao-ai/utils';
import type { Spacing, VisualProps } from '../types';
import { Box } from './box';
import styles from './index.jss';

export interface PageLayoutProps extends VisualProps {
  /** 页面留白，默认上下 60px、左右 100px。 */
  padding?: Spacing;
}

/** PPT 页面的基础布局，提供公共留白。 */
export function PageLayout({
  children,
  padding,
  className,
  style,
  ...attributes
}: PageLayoutProps) {
  return (
    <Box
      {...attributes}
      padding={padding}
      className={stringifyClass(styles.classes.pageLayout, className)}
      style={style}
    >
      {children}
    </Box>
  );
}
