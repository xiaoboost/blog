import { ChapterIntro } from '../../components/chapter-intro';

export function ParticipationChapter() {
  return (
    <ChapterIntro
      label="参与者"
      title="玩家的流向"
      paragraphs={[
        '每个版本，都有新面孔，也有继续参与和隔了一阵又回来的人。',
        '先看每版谁来聊，再看版本结束后的 28 天，谁还在聊。',
        '接下来，把六个专楼的发言账号放在一起看。',
      ]}
    />
  );
}
