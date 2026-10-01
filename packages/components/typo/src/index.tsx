import { defineUtils } from '@blog/context/runtime';
import assets from './typo.script';

export { TextGloss, type TextGlossProps } from './text-gloss';
export { Subtitle, type SubtitleProps } from './subtitle';
export { AuthorNote, type AuthorNoteProps } from './author-note';
export { ArticleIntro, BookInfo, type ArticleIntroProps, type BookInfoProps } from './intro';
export {
  DefinitionList,
  Definition,
  type DefinitionListProps,
  type DefinitionProps,
} from './definition-list';

export const utils = defineUtils(assets);
