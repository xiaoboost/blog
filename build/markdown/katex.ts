import katex from "katex";

import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type InlineState from 'markdown-it/lib/rules_inline/state_inline';
import type BlockState from 'markdown-it/lib/rules_block/state_block';

function isValidDelim(state: InlineState, pos: number) {
  const max = state.posMax;
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1;

  let can_open = true;
  let can_close = true;

  // Check non-whitespace conditions for opening and closing, and
  // check that closing delimeter isn't followed by a number
  if (
    prevChar === 0x20 /* " " */ ||
    prevChar === 0x09 /* \t */ ||
    (nextChar >= 0x30 /* "0" */ && nextChar <= 0x39) /* "9" */
  ) {
    can_close = false;
  }
  if (nextChar === 0x20 /* " " */ || nextChar === 0x09 /* \t */) {
    can_open = false;
  }

  return {
    can_open: can_open,
    can_close: can_close,
  };
}

function inline(state: InlineState, silent: boolean) {
  if (state.src[state.pos] !== "$") {
    return false;
  }

  let res = isValidDelim(state, state.pos);

  if (!res.can_open) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos += 1;
    return true;
  }

  // First check for and bypass all properly escaped delimieters
  // This loop will assume that the first leading backtick can not
  // be the first character in state.src, which is known since
  // we have found an opening delimieter already.
  const start = state.pos + 1;

  let match = start;
  let pos: number;

  while ((match = state.src.indexOf("$", match)) !== -1) {
    // Found potential $, look for escapes, pos will point to
    // first non escape when complete
    pos = match - 1;
    while (state.src[pos] === "\\") {
      pos -= 1;
    }

    // Even number of escapes, potential closing delimiter found
    if ((match - pos) % 2 === 1) {
      break;
    }
    match += 1;
  }

  // No closing delimter found.  Consume $ and continue.
  if (match === -1) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  // Check if we have empty content, ie: $$.  Do not parse.
  if (match - start === 0) {
    if (!silent) {
      state.pending += "$$";
    }
    state.pos = start + 1;
    return true;
  }

  // Check for valid closing delimiter
  res = isValidDelim(state, match);

  if (!res.can_close) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  let token: Token;

  if (!silent) {
    token = state.push("math_inline", "math", 0);
    token.markup = "$";
    token.content = state.src.slice(start, match);
  }

  state.pos = match + 1;
  return true;
}

function block(state: BlockState, start: number, end: number, silent: boolean) {
  let pos = state.bMarks[start] + state.tShift[start];
  let max = state.eMarks[start];

  if (pos + 2 > max) {
    return false;
  }

  if (state.src.slice(pos, pos + 2) !== "$$") {
    return false;
  }

  pos += 2;

  let firstLine = state.src.slice(pos, max);
  let lastLine = '';
  let found = false;

  if (silent) {
    return true;
  }

  if (firstLine.trim().slice(-2) === "$$") {
    // Single line expression
    firstLine = firstLine.trim().slice(0, -2);
    found = true;
  }

  let next: number;
  let lastPos: number;

  for (next = start; !found; ) {
    next++;

    if (next >= end) {
      break;
    }

    pos = state.bMarks[next] + state.tShift[next];
    max = state.eMarks[next];

    if (pos < max && state.tShift[next] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      break;
    }

    if (state.src.slice(pos, max).trim().slice(-2) === "$$") {
      lastPos = state.src.slice(0, max).lastIndexOf("$$");
      lastLine = state.src.slice(pos, lastPos);
      found = true;
    }
  }

  state.line = next + 1;

  const token = state.push("math_block", "math", 0);

  token.block = true;
  token.content = (
    (firstLine?.trim() ? firstLine + "\n" : "") +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine?.trim() ? lastLine : "")
  );

  token.map = [start, state.line];
  token.markup = "$$";

  return true;
}

export function MarkdownKatex(md: MarkdownIt, options: katex.KatexOptions = {}) {
  const katexInline = (latex: string) => {
    options.displayMode = false;
    options.output = 'html';

    try {
      return katex.renderToString(latex, options);
    }
    catch (error) {
      if (options.throwOnError) {
        console.log(error);
      }
      return latex;
    }
  };

  const inlineRenderer = (tokens: Token[], idx: number) => {
    return katexInline(tokens[idx].content);
  };

  const katexBlock = (latex: string) => {
    options.displayMode = true;
    options.output = 'html';

    try {
      return "<p>" + katex.renderToString(latex, options) + "</p>";
    }
    catch (error) {
      if (options.throwOnError) {
        console.log(error);
      }
      return latex;
    }
  };

  const blockRenderer = (tokens: Token[], idx: number) => {
    return katexBlock(tokens[idx].content) + "\n";
  };

  md.inline.ruler.after("escape", "math_inline", inline);
  md.block.ruler.after("blockquote", "math_block", block, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.renderer.rules.math_inline = inlineRenderer;
  md.renderer.rules.math_block = blockRenderer;
}
