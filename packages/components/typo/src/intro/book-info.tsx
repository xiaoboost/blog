import { useFontText } from '@blog/context/runtime';
import { ArrowUpRight } from '@blog/icons';
import { SecondaryTitleFont } from '@blog/styles';
import React from 'react';
import styles from './book-info.jss';

export interface BookInfoProps {
  /** 介绍小标题，默认“这次读的是”。 */
  label?: string;
  /** 作品名；不自动加书名号，也不作为链接。 */
  title: string;
  /** 可选的正式副标题，紧随作品名；空白字符串不显示。 */
  subtitle?: string;
  author?: {
    name: string;
    href?: string;
    /** 默认“著”；空字符串省略中点与后缀，游戏可填写“开发”。 */
    role?: string;
  };
  /** 书名下方的简短资料，如“已完结”；多项用中点分隔。 */
  meta?: string[];
  /** 可选的补充说明，支持行内元素和 MDX 节点。 */
  details?: React.ReactNode;
  /** 最下方的作品入口；context 为显示文案，组件统一添加箭头。 */
  link?: {
    context: string;
    href: string;
  };
}

/** 作品介绍；资料紧随书名，署名和作品入口各占一行。 */
export function BookInfo({
  label = '这次读的是',
  title,
  subtitle,
  author,
  meta,
  details,
  link,
}: BookInfoProps) {
  useFontText(SecondaryTitleFont.fontFamily, title);

  const { classes } = styles;
  const subtitleText = subtitle?.trim();
  const items = meta?.map((item) => item.trim()).filter(Boolean) ?? [];
  const role = author?.role ?? '著';
  const hasDetails = React.Children.toArray(details).some((node) => node !== '');

  return (
    <div className={classes.bookInfo}>
      {label && <div className={classes.bookLabel}>{label}</div>}
      <div className={classes.bookHeading}>
        <div className={classes.bookTitle}>{title}</div>
        {subtitleText && <div className={classes.bookSubtitle}>{subtitleText}</div>}
      </div>
      {items.length > 0 && (
        <ul className={classes.bookMeta} aria-label="作品资料">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>
              {index > 0 && <span className={classes.separatorDot} aria-hidden="true" />}
              {item}
            </li>
          ))}
        </ul>
      )}
      {author && (
        <div className={classes.bookAuthor}>
          {author.href
            ? <a href={author.href} target="_blank" rel="noreferrer">{author.name}</a>
            : <span>{author.name}</span>}
          {role && (
            <span className={classes.authorRole}>
              <span className={classes.separatorDot} aria-hidden="true" />
              <span>{role}</span>
            </span>
          )}
        </div>
      )}
      {hasDetails && <div className={classes.bookDetails}>{details}</div>}
      {link && (
        <a className={classes.bookLink} href={link.href} target="_blank" rel="noreferrer">
          <span>{link.context}</span>
          <ArrowUpRight className={classes.sourceIcon} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
