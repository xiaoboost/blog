import React from 'react';
import { Animate } from './animate';
import type { EffectProps } from './types';

/** 效果不设置时间默认值，继续按动作 → 最近分组 → Step → Player → 默认值继承。 */
export function FadeIn(props: EffectProps) {
  return (
    <Animate
      {...props}
      from={{ opacity: 0 }}
      to={{ opacity: 1 }}
      before={{ visibility: 'visible' }}
    />
  );
}

export function FadeOut(props: EffectProps) {
  return <Animate {...props} to={{ opacity: 0 }} after={{ visibility: 'hidden' }} />;
}

export interface MoveProps extends EffectProps {
  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;
  fade?: boolean;
}

export type MoveInProps = MoveProps;
export type MoveOutProps = MoveProps;

function movement(direction: NonNullable<MoveProps['direction']>, distance: number): string {
  const x = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
  const y = direction === 'top' ? -distance : direction === 'bottom' ? distance : 0;
  return `${x}px ${y}px`;
}

export function MoveIn(input: MoveInProps) {
  const {
    direction = 'bottom',
    distance = 32,
    fade = true,
    ...props
  } = input;

  const translate = movement(direction, distance);
  return (
    <Animate
      {...props}
      from={{ translate, ...(fade ? { opacity: 0 } : {}) }}
      to={{ translate: '0px 0px', ...(fade ? { opacity: 1 } : {}) }}
      before={{ visibility: 'visible' }}
    />
  );
}

export function MoveOut({
  direction = 'bottom',
  distance = 32,
  fade = true,
  ...props
}: MoveOutProps) {
  const translate = movement(direction, distance);
  return (
    <Animate
      {...props}
      to={{ translate, ...(fade ? { opacity: 0 } : {}) }}
      after={{ visibility: 'hidden' }}
    />
  );
}

export interface ScaleProps extends EffectProps {
  scale?: number;
  origin?: string;
  fade?: boolean;
}

export type ScaleInProps = ScaleProps;
export type ScaleOutProps = ScaleProps;

export function ScaleIn(input: ScaleInProps) {
  const {
    scale = 0.9,
    origin = 'center',
    fade = true,
    ...props
  } = input;

  return (
    <Animate
      {...props}
      from={{ scale, ...(fade ? { opacity: 0 } : {}) }}
      to={{ scale: 1, ...(fade ? { opacity: 1 } : {}) }}
      before={{ visibility: 'visible', transformOrigin: origin }}
    />
  );
}

export function ScaleOut({
  scale = 0.9,
  origin = 'center',
  fade = true,
  ...props
}: ScaleOutProps) {
  return (
    <Animate
      {...props}
      to={{ scale, ...(fade ? { opacity: 0 } : {}) }}
      before={{ transformOrigin: origin }}
      after={{ visibility: 'hidden' }}
    />
  );
}

export interface RotateProps extends EffectProps {
  angle?: number;
  origin?: string;
  fade?: boolean;
}

export type RotateInProps = RotateProps;
export type RotateOutProps = RotateProps;

export function RotateIn({
  angle = -15,
  origin = 'center',
  fade = true,
  ...props
}: RotateInProps) {
  const rotate = `${angle}deg`;
  return (
    <Animate
      {...props}
      from={{ rotate, ...(fade ? { opacity: 0 } : {}) }}
      to={{ rotate: '0deg', ...(fade ? { opacity: 1 } : {}) }}
      before={{ visibility: 'visible', transformOrigin: origin }}
    />
  );
}

export function RotateOut({
  angle = 15,
  origin = 'center',
  fade = true,
  ...props
}: RotateOutProps) {
  const rotate = `${angle}deg`;
  return (
    <Animate
      {...props}
      to={{ rotate, ...(fade ? { opacity: 0 } : {}) }}
      before={{ transformOrigin: origin }}
      after={{ visibility: 'hidden' }}
    />
  );
}

export interface WipeProps extends EffectProps {
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export type WipeInProps = WipeProps;
export type WipeOutProps = WipeProps;

function clipping(direction: NonNullable<WipeProps['direction']>): string {
  const edges = {
    left: 'inset(0 100% 0 0)',
    right: 'inset(0 0 0 100%)',
    top: 'inset(0 0 100% 0)',
    bottom: 'inset(100% 0 0 0)',
  };

  return edges[direction];
}

export function WipeIn({ direction = 'left', ...props }: WipeInProps) {
  return (
    <Animate
      {...props}
      from={{ clipPath: clipping(direction) }}
      to={{ clipPath: 'inset(0 0 0 0)' }}
      before={{ visibility: 'visible' }}
    />
  );
}

export function WipeOut({ direction = 'left', ...props }: WipeOutProps) {
  return (
    <Animate
      {...props}
      from={{ clipPath: 'inset(0 0 0 0)' }}
      to={{ clipPath: clipping(direction) }}
      after={{ visibility: 'hidden' }}
    />
  );
}

export interface PulseProps extends EffectProps {
  scale?: number;
  origin?: string;
}

export function Pulse({ scale = 1.05, origin = 'center', ...props }: PulseProps) {
  return (
    <Animate
      {...props}
      keyframes={[{ scale: 1 }, { scale }, { scale: 1 }]}
      before={{ transformOrigin: origin }}
    />
  );
}
