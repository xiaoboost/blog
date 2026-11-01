import type { categories } from './data';

export const categoryDescriptions: Readonly<Record<typeof categories[number], string>> = {
  '强度与实用': '伤害高、角色好用、功能实用',
  '搭配与选择': '配合巧妙、组合丰富、限制更少',
  '操作与反馈': '操作顺手、衔接流畅、反馈舒服',
  '轻松与省事': '通关轻松、流程方便、减少重复',
  '内容与趣味': '活动、关卡、探索或建设有意思',
  '挑战与掌握': '乐于钻研，从理解与进步中满足',
};
