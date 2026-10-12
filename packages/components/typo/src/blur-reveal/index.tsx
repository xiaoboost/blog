import { defineUtils } from '@blog/context/runtime';
import { stringifyClass } from '@xiao-ai/utils';
import React, { useId } from 'react';

import styles from './index.jss';
import assets from './index.script';

export interface BlurRevealProps {
  className?: string;
  styles?: React.CSSProperties;
  buttonText?: string;
  children: React.ReactNode;
}

export function BlurReveal({
  children,
  className,
  styles: customStyles,
  buttonText = '查看更多',
}: BlurRevealProps) {
  const { classes: styleClasses } = styles;
  const contentId = useId();

  return (
    <div className={stringifyClass(styleClasses.blurReveal, className)} style={customStyles}>
      <div className={stringifyClass(styleClasses.blurRevealFogLeft, styleClasses.blurRevealFog)} />
      <div
        className={stringifyClass(styleClasses.blurRevealFogRight, styleClasses.blurRevealFog)}
      />
      <div className={styleClasses.blurRevealOverlay}>
        <button
          type="button"
          className={styleClasses.blurRevealOverlayBtn}
          aria-controls={contentId}
          aria-expanded="false"
        >
          {buttonText}
        </button>
      </div>
      <div id={contentId} className={styleClasses.blurRevealContent} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export const utils = defineUtils(assets);
