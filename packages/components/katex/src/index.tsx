import React from 'react';
import Katex from 'katex';
import assets from './main.script';

export { assets };

export function KatexBlock(math: string) {
  return <div>block</div>;
}

export function KatexInline(math: string) {
  return <div>inline</div>;
}
