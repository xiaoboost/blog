import React from 'react';

import { Layout, LayoutProps } from '../../components/layout';

interface YearListProps extends LayoutProps {
  years: Array<{
    year: string;
    url: string;
    number: number;
  }>;
}

export function YearList(props: YearListProps) {
  return <Layout {...props}>year</Layout>;
}
