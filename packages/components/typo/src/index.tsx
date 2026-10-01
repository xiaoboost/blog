import { defineUtils } from '@blog/context/runtime';
import assets from './typo.script';

export { TextGloss, type TextGlossProps } from './text-gloss';
export { Subtitle, type SubtitleProps } from './subtitle';
export { Comment, type CommentProps } from './comment';
export { ArticleIntro, BookInfo, type ArticleIntroProps, type BookInfoProps } from './intro';
export {
  DefinitionList,
  Definition,
  type DefinitionListProps,
  type DefinitionProps,
} from './definition-list';

export const utils = defineUtils(assets);
