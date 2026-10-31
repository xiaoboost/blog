// 来源：gameplay-negative-charts-20261031/chart-data.json；分母包含未分出细类的入选负面帖。
import type { MatrixColumn } from '../../components/content-analysis/types';
import type { GameId } from '../data';

export const categories = [
  "机制与配队",
  "玩法与偏好",
  "难度与门槛",
  "操作与反馈",
  "重复与负担",
  "数值与保值"
] as const;

export const complaintColumns: readonly MatrixColumn[] = [
  {
    "id": "overall",
    "denominator": 11053,
    "counts": [
      4829,
      2809,
      2011,
      1747,
      1420,
      1134
    ]
  },
  {
    "id": "genshin",
    "denominator": 1958,
    "counts": [
      1085,
      285,
      379,
      231,
      117,
      253
    ]
  },
  {
    "id": "starRail",
    "denominator": 1594,
    "counts": [
      974,
      172,
      359,
      66,
      116,
      367
    ]
  },
  {
    "id": "zenless",
    "denominator": 847,
    "counts": [
      389,
      183,
      225,
      131,
      75,
      116
    ]
  },
  {
    "id": "arknights",
    "denominator": 1024,
    "counts": [
      499,
      264,
      233,
      52,
      147,
      57
    ]
  },
  {
    "id": "endfield",
    "denominator": 3532,
    "counts": [
      937,
      1367,
      438,
      877,
      764,
      133
    ]
  },
  {
    "id": "wutheringWaves",
    "denominator": 2098,
    "counts": [
      945,
      538,
      377,
      390,
      201,
      208
    ]
  }
];

export const quotes: readonly { gameId: GameId; pid: number; tid: number; categories: readonly string[]; text: string; date: string }[] = [
  {
    "gameId": "starRail",
    "pid": 70152070,
    "tid": 2170568,
    "categories": [
      "机制与配队",
      "难度与门槛"
    ],
    "text": "30金击破终于在4.5绝境王棋被肘死了，灵砂哪怕满命也保不住人，一个击破buff都没有实在是没招了",
    "date": "2026-08-26"
  },
  {
    "gameId": "endfield",
    "pid": 69581319,
    "tid": 2265954,
    "categories": [
      "重复与负担"
    ],
    "text": "开服我就说这玩意怕就怕出个新装备得跟着迭代更新蓝图，可太麻烦了",
    "date": "2026-05-06"
  }
];
