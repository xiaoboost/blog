import React from 'react';
import Katex from 'katex';

export const assets: Record<string, string> = require((0, eval)(`"./assets"`)).default;

export function KatexBlock(math: string) {
  return <div>block</div>;
}

export function KatexInline(math: string) {
  return <div>inline</div>;
}
