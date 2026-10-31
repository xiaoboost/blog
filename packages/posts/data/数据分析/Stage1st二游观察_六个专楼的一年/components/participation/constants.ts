export const panelWidth = 544;
export const chartHeight = 694;
export const chartLeft = 126;
export const plotWidth = 350;
export const plotHeight = 620;

export const participationColors = {
  first: '#579c99',
  continued: '#6686ad',
  returning: '#c29459',
  baseline: '#b9bec5',
  returned: '#6686ad',
  absent: '#d6b5a9',
} as const;

export const compositionKeys = ['first', 'continued', 'returning'] as const;
export const compositionLabels = {
  first: '首次出现',
  continued: '上版延续',
  returning: '隔期回流',
} as const;

export const followupKeys = ['returned', 'absent'] as const;
export const followupLabels = { returned: '再次发言', absent: '未再发言' } as const;
