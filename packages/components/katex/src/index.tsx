import React from 'react';
import Katex from 'katex';

export const assets: any = require("./index.script").default;

export function KatexBlock(math: string) {
  return <div>block1</div>;
}

export function KatexInline(math: string) {
  return <div>inline</div>;
}
