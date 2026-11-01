// 来源：draft/二游论坛观察/materials/data/endfield-gacha-negative-dsf-20261102/summary.json。
// 分母保留全部入选负面帖子；多标签，包含公测前及未来预期。
export const denominator = 1222;
export const unclassified = 316;

export const categories = [
  {
    "name": "福利与供给",
    "count": 307,
    "description": "抽数少、获取慢，日常奖励与自选进度不足"
  },
  {
    "name": "出货与重复",
    "count": 302,
    "description": "吃保底、抽歪、重复出不需要的角色或武器"
  },
  {
    "name": "抽取价值",
    "count": 143,
    "description": "投入不值、角色或武器不好用、替代与排期"
  },
  {
    "name": "规则与保底",
    "count": 136,
    "description": "保底继承、清零、自选保障与复杂规则"
  },
  {
    "name": "武器与配套",
    "count": 75,
    "description": "角色与武器资源牵连，整套获取成本高"
  },
  {
    "name": "奖励与诱导",
    "count": 67,
    "description": "为奖励追加抽取，或被领取条件拖着走"
  }
] as const;

export const quotes = [
  {
    "pid": 69873556,
    "tid": 2265954,
    "category": "福利与供给",
    "date": "2026-07-05",
    "text": "都要半周年了距离普池自选还要130多抽，也算是前无古人了吧，既然你不想让大家白嫖武器抽数，那就直接送普池角色自选呗"
  },
  {
    "pid": 69655717,
    "tid": 2265954,
    "category": "武器与配套",
    "date": "2026-05-22",
    "text": "你越是角色欧越是没资源抽武器，多抽几发补武库，又有前面潜能奖励勾引你再多抽点，小巧思拉满了。"
  }
] as const;
