import type { ReactNode } from 'react';
import type { VisualProps } from '../types';

export interface SlideProps extends VisualProps {
  children: ReactNode;
}

export interface SectionProps extends VisualProps {
  children: ReactNode;
  title?: string;
}
