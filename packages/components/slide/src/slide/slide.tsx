import { stringifyClass } from '@xiao-ai/utils';
import { SlideStoreContext } from './collect/context';
import { useRegisterSlide } from './collect/plugin';
import { useSlideValue } from './collect/use-slide-provider';
import styles from './index.jss';
import type { SlideProps } from './types';

export function Slide({
  children,
  className,
  style,
  ...attributes
}: SlideProps) {
  const store = useSlideValue();
  const classes = stringifyClass(styles.classes.slide, className);

  useRegisterSlide(store);

  return (
    <SlideStoreContext.Provider value={store}>
      <div
        {...attributes}
        className={classes}
        style={style}
      >
        {children}
      </div>
    </SlideStoreContext.Provider>
  );
}
