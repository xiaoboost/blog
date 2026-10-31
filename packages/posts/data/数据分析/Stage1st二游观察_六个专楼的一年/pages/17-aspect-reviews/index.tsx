import React from 'react';
import { AspectReviewsPage } from '../../components/aspect-reviews';
import { gameIds } from './data';

export function AspectReviewsFirst() {
  return <AspectReviewsPage gameIds={gameIds} />;
}
