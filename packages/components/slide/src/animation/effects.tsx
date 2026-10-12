import React from 'react';
import { AnimationAction } from './animate';
import type { EffectProps } from './types';

/** 效果不设置时间默认值，继续按动作 → Step → Player → 默认值继承。 */
export function FadeIn(props: EffectProps) {
  return (
    <AnimationAction
      {...props}
      from={{ opacity: 0 }}
      to={{ opacity: 1 }}
      before={{ visibility: 'visible' }}
    />
  );
}

export function FadeOut(props: EffectProps) {
  return <AnimationAction {...props} to={{ opacity: 0 }} after={{ visibility: 'hidden' }} />;
}

export interface MoveInProps extends EffectProps {
  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;
  fade?: boolean;
}

export function MoveIn(input: MoveInProps) {
  const {
    direction = 'bottom',
    distance = 32,
    fade = true,
    ...props
  } = input;

  if (typeof fade !== 'boolean') {
    throw new Error('[mdx-slide] MoveIn.fade 必须是布尔值。');
  }

  if (!Number.isFinite(distance) || distance < 0) {
    throw new Error('[mdx-slide] MoveIn.distance 必须是非负有限数值。');
  }

  if (![
    'left',
    'right',
    'top',
    'bottom',
  ].includes(direction)) {
    throw new Error('[mdx-slide] MoveIn.direction 必须是 left、right、top 或 bottom。');
  }

  const x = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
  const y = direction === 'top' ? -distance : direction === 'bottom' ? distance : 0;
  return (
    <AnimationAction
      {...props}
      from={{ transform: `translate3d(${x}px, ${y}px, 0)`, ...(fade ? { opacity: 0 } : {}) }}
      to={{ transform: 'translate3d(0, 0, 0)', ...(fade ? { opacity: 1 } : {}) }}
      before={{ visibility: 'visible' }}
    />
  );
}

export interface ScaleInProps extends EffectProps {
  scale?: number;
  origin?: string;
  fade?: boolean;
}

export function ScaleIn(input: ScaleInProps) {
  const {
    scale = 0.9,
    origin = 'center',
    fade = true,
    ...props
  } = input;

  if (typeof fade !== 'boolean') {
    throw new Error('[mdx-slide] ScaleIn.fade 必须是布尔值。');
  }

  if (!Number.isFinite(scale) || scale < 0) {
    throw new Error('[mdx-slide] ScaleIn.scale 必须是非负有限数值。');
  }

  if (typeof origin !== 'string' || !origin.trim()) {
    throw new Error('[mdx-slide] ScaleIn.origin 必须是非空字符串。');
  }

  return (
    <AnimationAction
      {...props}
      from={{ transform: `scale(${scale})`, ...(fade ? { opacity: 0 } : {}) }}
      to={{ transform: 'scale(1)', ...(fade ? { opacity: 1 } : {}) }}
      before={{ visibility: 'visible', transformOrigin: origin }}
    />
  );
}
