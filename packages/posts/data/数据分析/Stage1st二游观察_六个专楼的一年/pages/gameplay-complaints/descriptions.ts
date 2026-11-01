import type { categories } from './data';

export const categoryDescriptions: Readonly<Record<typeof categories[number], string>> = {
  '机制与配队': '角色强弱、技能循环、配队与规则',
  '玩法与偏好': '不喜欢某种模式，觉得无趣',
  '难度与门槛': '高难关卡太难，通关或操作门槛高',
  '操作与反馈': '操作不顺、手感不佳、反馈不清',
  '重复与负担': '重复刷取、流程长、重来与基建维护',
  '数值与保值': '数值膨胀、新旧替代与投入贬值',
};
