import { ChapterIntro } from '../../components/chapter-intro';

export function TimelineChapter() {
  return (
    <ChapterIntro
      label="时间线"
      title="讨论的起伏"
      paragraphs={[
        '前面，我们看到了六个专楼一年的讨论规模。',
        '同样多的回复，可以集中在版本开启的几天，也可以散落在之后的日常里。',
        '接下来，把这一年沿着时间展开。',
      ]}
    />
  );
}
