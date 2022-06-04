/* eslint-disable max-len */

export interface Icon {
  viewBox: string;
  path: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
}

export const circleThin: Icon = {
  viewBox: '0 0 8 8',
  fill: 'transparent',
  stroke: 'currentColor',
  strokeWidth: '1',
  path: 'M 4, 4 m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
};

export const circle: Icon = {
  viewBox: '0 0 8 8',
  fill: 'currentColor',
  path: 'M 4, 4 m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
};
