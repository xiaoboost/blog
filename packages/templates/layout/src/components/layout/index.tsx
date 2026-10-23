import { ScrollBar } from '@blog/component-scrollbar';
import { default as React, type PropsWithChildren } from 'react';
import { Document, type DocumentProps } from '../document';
import { Footer } from '../footer';
import { GotoTop } from '../goto-top';
import { Header } from '../header';
import { type MainContentProps, MainContent } from '../main-content';

export interface LayoutProps extends DocumentProps, MainContentProps {}

export function Layout(props: PropsWithChildren<LayoutProps>) {
  return (
    <Document {...props}>
      <Header />
      <MainContent bodyClassName={props.bodyClassName}>{props.children}</MainContent>
      <Footer />
      <GotoTop />
      <ScrollBar width={8} mode="y" />
    </Document>
  );
}
