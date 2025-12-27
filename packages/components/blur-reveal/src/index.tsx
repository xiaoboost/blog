import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';
import { defineUtils } from '@blog/context/runtime';

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
  return (
    <div className={stringifyClass(styleClasses.blurReveal, className)} style={customStyles}>
      <div className={stringifyClass(styleClasses.blurRevealFogLeft, styleClasses.blurRevealFog)} />
      <div
        className={stringifyClass(styleClasses.blurRevealFogRight, styleClasses.blurRevealFog)}
      />
      <div className={styleClasses.blurRevealOverlay}>
        <span className={styleClasses.blurRevealOverlayBtn}>{buttonText}</span>
      </div>
      <div className={styleClasses.blurRevealContent}>{children}</div>
    </div>
  );
}

export const utils = defineUtils(assets);
