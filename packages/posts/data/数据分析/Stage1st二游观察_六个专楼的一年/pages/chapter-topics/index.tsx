import { ChapterIntro } from '../../components/chapter-intro';

export function TopicsChapter() {
  return (
    <ChapterIntro
      label="话题与评价"
      title="大家在聊什么"
      paragraphs={[
        '剧情、角色、玩法、抽卡……哪些内容占据了讨论？',
        '先看六个楼的讨论重心，再看各方面的称赞与抱怨。',
        '最后，把玩法方面的称赞与抱怨分别拆开看看。',
      ]}
    />
  );
}
