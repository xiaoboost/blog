import type { topics } from '../../components/content-analysis/constants';

export const topicGuide: readonly {
  topic: typeof topics[number];
  description: readonly [string, string];
  examples: string;
}[] = [
  {
    topic: '故事与世界',
    description: ['剧情走向与人物在故事中的行为，', '以及世界观、设定和主题。'],
    examples: '主线 · 任务故事 · 世界观设定',
  },
  {
    topic: '角色与形象',
    description: ['角色的性格与关系、玩家的喜好，', '以及立绘、建模、服装和造型。'],
    examples: '性格关系 · 立绘 · 建模 · 服装',
  },
  {
    topic: '演出与视听',
    description: ['游戏内实际呈现的镜头与声音，', '包括过场、动作、配音和音乐。'],
    examples: '过场 · 配音 · 音乐 · 动作表现',
  },
  {
    topic: '玩法与挑战',
    description: ['战斗、探索解谜与周期性高难挑战，', '包括角色强度、技能和队伍搭配。'],
    examples: '高难挑战（如深渊） · 技能循环 · 基建机制',
  },
  {
    topic: '养成与积累',
    description: ['账号长期成长需要的培养与刷取，', '以及相应的资源积累和投入。'],
    examples: '素材体力 · 培养成本 · 刷装备',
  },
  {
    topic: '抽卡体验与福利',
    description: ['抽取过程、结果与卡池选择，', '以及抽卡资源赠送和相关补偿。'],
    examples: '卡池 · 保底 · 抽卡结果 · 福利',
  },
  {
    topic: '社区与交流',
    description: ['玩家之间的讨论、争论与交流，', '以及社区创作和内容传播。'],
    examples: '论坛氛围 · 爆料信源 · 同人二创',
  },
  {
    topic: '宣传与衍生',
    description: ['官方在游戏外推出的宣传作品，', '以及活动、周边等衍生内容。'],
    examples: 'PV / EP · 前瞻 · 演唱会 · 周边',
  },
  {
    topic: '其他',
    description: ['上述分类之外的其他明确话题，', '包括更新运营、技术与商业讨论。'],
    examples: '更新排期 · 性能 · 界面 · 流水',
  },
];
