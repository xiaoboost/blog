export const topics = [
  '玩法与挑战', '故事与世界', '角色与形象', '演出与视听', '养成与积累',
  '抽卡体验与福利', '社区与交流', '宣传与衍生', '其他',
] as const;

export const sentimentKeys = ['positive', 'negative', 'mixed', 'neutral'] as const;
export const sentimentLabels = { positive: '正面', negative: '负面', mixed: '混合', neutral: '中性' } as const;
export const sentimentColors = { positive: '#579c99', negative: '#b97569', mixed: '#c29459', neutral: '#b9bec5' } as const;
export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const shortTopic = (topic: string) => topic === '抽卡体验与福利' ? '抽卡与福利' : topic;
