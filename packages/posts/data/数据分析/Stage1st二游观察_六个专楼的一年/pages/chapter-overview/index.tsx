import React from 'react';
import { ChapterIntro } from '../../components/chapter-intro';

export function OverviewChapter() {
  return <ChapterIntro label="总览" title="六个专楼的样子" paragraphs={[
    '一年里，六个专楼积累了多少讨论？',
    '有多少人在发言，他们又怎样穿梭于不同的楼之间？',
    '先从讨论的规模、发言者的交集和回复的贡献看起。',
  ]} />;
}
