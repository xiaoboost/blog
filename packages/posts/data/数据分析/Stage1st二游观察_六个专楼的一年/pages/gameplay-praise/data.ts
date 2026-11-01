// 来源：draft/二游论坛观察/materials/data/gameplay-positive-dsf-20261102/summary.json；分母包含未分出细类的入选正面帖。
import type { MatrixColumn } from '../../components/content-analysis/types';
import type { GameId } from '../data';

export const categories = [
  "强度与实用",
  "轻松与省事",
  "内容与趣味",
  "搭配与选择",
  "操作与反馈",
  "挑战与掌握"
] as const;

export const praiseColumns: readonly MatrixColumn[] = [
  {
    "id": "overall",
    "denominator": 5214,
    "counts": [
      2278,
      1276,
      938,
      550,
      368,
      117
    ]
  },
  {
    "id": "genshin",
    "denominator": 941,
    "counts": [
      509,
      216,
      92,
      114,
      38,
      11
    ]
  },
  {
    "id": "starRail",
    "denominator": 770,
    "counts": [
      425,
      167,
      85,
      67,
      5,
      12
    ]
  },
  {
    "id": "zenless",
    "denominator": 433,
    "counts": [
      175,
      128,
      40,
      40,
      61,
      14
    ]
  },
  {
    "id": "arknights",
    "denominator": 614,
    "counts": [
      301,
      149,
      137,
      59,
      16,
      18
    ]
  },
  {
    "id": "endfield",
    "denominator": 1227,
    "counts": [
      388,
      381,
      307,
      151,
      91,
      35
    ]
  },
  {
    "id": "wutheringWaves",
    "denominator": 1229,
    "counts": [
      480,
      235,
      277,
      119,
      157,
      27
    ]
  }
];

export const quotes: readonly { gameId: GameId; pid: number; tid: number; categories: readonly string[]; text: string; date: string }[] = [
  {
    "gameId": "genshin",
    "pid": 70034976,
    "tid": 2194776,
    "categories": [
      "轻松与省事"
    ],
    "text": "不管什么活动都是为了最轻松拿原石，小游戏玩法只是调味剂，所以最好的活动形式还是逸闻，拿原石同时还能看一段剧情",
    "date": "2026-08-08"
  },
  {
    "gameId": "wutheringWaves",
    "pid": 69291601,
    "tid": 2059881,
    "categories": [
      "挑战与掌握"
    ],
    "text": "那我还是喜欢3个人轮流出现的玩法，熟练了简单合轴之后的操作更加有成就感",
    "date": "2026-03-07"
  }
];
