import React from 'react';
import { ParticipationPage } from '../../components/participation';
import { panels } from './data';

export function ParticipantFollowupFirst() {
  return <ParticipationPage mode="followup" panels={panels} />;
}
