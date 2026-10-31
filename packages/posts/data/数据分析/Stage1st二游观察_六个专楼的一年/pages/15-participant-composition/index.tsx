import React from 'react';
import { ParticipationPage } from '../../components/participation';
import { panels } from './data';

export function ParticipantCompositionFirst() {
  return <ParticipationPage mode="composition" panels={panels} />;
}
