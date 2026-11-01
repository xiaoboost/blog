import { stringifyClass } from '@xiao-ai/utils';
import type { Length, VisualProps } from '../types';
import styles from './index.jss';

export interface EyebrowProps extends VisualProps {
  /**
   * 与下方标题或内容的间距
   *
   * @default 16px
   */
  marginBottom?: Length;
}

/** PPT 大标题上方的引导短句 */
export function Eyebrow({
  children,
  className,
  style,
  marginBottom,
  ...attributes
}: EyebrowProps) {
  return (
    <p
      {...attributes}
      className={stringifyClass(styles.classes.eyebrow, className)}
      style={{ marginBottom, ...style }}
    >
      {children}
    </p>
  );
}
