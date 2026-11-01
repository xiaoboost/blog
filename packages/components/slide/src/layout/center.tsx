import { stringifyClass } from '@xiao-ai/utils';
import type { BoxProps } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface CenterProps extends BoxProps {
  horizontal?: boolean;
  vertical?: boolean;
}

export function Center({
  horizontal,
  vertical,
  children,
  className,
  style,
  ...props
}: CenterProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, styles.classes.center, className)}
      style={{
        justifyContent: horizontal === undefined ? undefined : horizontal ? 'center' : 'flex-start',
        alignItems: vertical === undefined ? undefined : vertical ? 'center' : 'flex-start',
        ...boxStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
