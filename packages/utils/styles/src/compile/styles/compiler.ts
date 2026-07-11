import { generateClassName } from './classname';
import { resolveSelector } from './nested';
import { normalizeKey, normalizeValue } from './normalize';

import type { StyleSheet, StyleRule, Styles } from './types';

// ═══════════════════════════════════════════════════════════════
// 编译
// ═══════════════════════════════════════════════════════════════

interface FlatRule {
  selector: string;
  props: string;
  media?: string;
}

function buildClassMap(styles: Styles, salt?: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of Object.keys(styles)) {
    if (!key.startsWith('@')) map[key] = generateClassName(key, salt);
  }
  return map;
}

// ── 递归编译入口 ───────────────────────────────────────────────

function compileRule(
  rule: StyleRule,
  selector: string,
  classMap: Record<string, string>,
): FlatRule[] {
  const rules: FlatRule[] = [];
  const propLines: string[] = [];

  for (const key of Object.keys(rule)) {
    if (key.startsWith('&')) {
      const sel = resolveSelector(key, selector, classMap);
      rules.push(...compileRule(rule[key] as StyleRule, sel, classMap));
    }
    else if (key.startsWith('@')) {
      rules.push(...compileAtRule(key, rule[key] as StyleRule, selector, classMap));
    }
    else {
      propLines.push(`  ${normalizeKey(key)}: ${normalizeValue(key, rule[key])};`);
    }
  }

  if (propLines.length > 0) {
    rules.unshift({ selector, props: propLines.join('\n') });
  }

  return rules;
}

// ── @-规则 ──────────────────────────────────────────────────────

function compileAtRule(
  atKey: string,
  value: StyleRule,
  selector: string,
  classMap: Record<string, string>,
): FlatRule[] {
  if (atKey === '@global') return compileGlobal(value, classMap);
  if (atKey === '@font-face') return compileFontFace(value);
  if (atKey.startsWith('@media')) return compileMedia(atKey, value, selector, classMap);
  return [];
}

function compileGlobal(rule: StyleRule, classMap: Record<string, string>): FlatRule[] {
  const rules: FlatRule[] = [];

  for (const key of Object.keys(rule)) {
    if (key.startsWith('@media')) {
      // @media inside @global: content keys are selectors
      const content = rule[key] as StyleRule;
      for (const sel of Object.keys(content)) {
        rules.push(
          ...compileRule(content[sel] as StyleRule, sel, classMap)
            .map((r) => ({ ...r, media: key })),
        );
      }
    }
    else if (key.startsWith('@')) {
      rules.push(...compileAtRule(key, rule[key] as StyleRule, key, classMap));
    }
    else {
      rules.push(...compileRule(rule[key] as StyleRule, key, classMap));
    }
  }

  return rules;
}

function compileMedia(
  mediaKey: string,
  rule: StyleRule,
  selector: string,
  classMap: Record<string, string>,
): FlatRule[] {
  return compileRule(rule, selector, classMap).map((r) => ({ ...r, media: mediaKey }));
}

function compileFontFace(rule: StyleRule): FlatRule[] {
  const lines: string[] = [];
  for (const key of Object.keys(rule)) {
    lines.push(`  ${normalizeKey(key)}: ${normalizeValue(key, rule[key])};`);
  }
  return lines.length > 0 ? [{ selector: '@font-face', props: lines.join('\n') }] : [];
}

// ── 序列化 ─────────────────────────────────────────────────────

function serializeRules(rules: FlatRule[]): string {
  const normal = rules.filter((r) => !r.media);
  const mediaGroups = new Map<string, FlatRule[]>();

  for (const r of rules) {
    if (r.media) {
      const group = mediaGroups.get(r.media) || [];
      group.push(r);
      mediaGroups.set(r.media, group);
    }
  }

  const blocks: string[] = [];

  for (const r of normal) {
    if (r.props === '') {
      blocks.push(r.selector);
    }
    else {
      blocks.push(`${r.selector} {\n${r.props}\n}`);
    }
  }

  for (const [mq, grouped] of mediaGroups) {
    const inner = grouped
      .map((r) => `  ${r.selector} {\n${r.props.replace(/^/gm, '  ')}\n  }`)
      .join('\n');
    blocks.push(`${mq} {\n${inner}\n}`);
  }

  return blocks.join('\n');
}

// ── 公开 API ───────────────────────────────────────────────────

export function compileStyles<C extends string>(styles: Styles<C>): StyleSheet<C> {
  const salt = JSON.stringify(styles);
  const classMap = buildClassMap(styles, salt);
  const flatRules: FlatRule[] = [];

  for (const [key, rule] of Object.entries(styles)) {
    if (typeof rule === 'string') {
      flatRules.push({ selector: `${key} ${rule}`, props: '' });
    }
    else if (key.startsWith('@')) {
      flatRules.push(...compileAtRule(key, rule as StyleRule, '', classMap));
    }
    else {
      const sel = `.${classMap[key]}`;
      flatRules.push(...compileRule(rule as StyleRule, sel, classMap));
    }
  }

  const css = serializeRules(flatRules);

  return {
    classes: classMap as Record<C, string>,
    toString: () => css,
  };
}

/**
 * 合并多个 StyleSheet。
 * classes 合并（同名后者覆盖），CSS 拼接。
 */
export function mergeStyles(...sheets: StyleSheet[]): StyleSheet {
  const classes: Record<string, string> = {};

  for (const s of sheets) {
    Object.assign(classes, s.classes);
  }

  const css = sheets.map((s) => s.toString()).filter(Boolean).join('\n');

  return {
    classes,
    toString: () => css,
  };
}

/**
 * 创建 @font-face。
 */
export function createFontFaceStyles(
  family: string,
  style: string,
  weight: string,
  url: string,
): StyleSheet {
  return compileStyles({
    '@font-face': {
      fontFamily: family,
      fontStyle: style,
      fontWeight: weight,
      src: `url('${url}.woff2') format('woff2')`,
    },
  } as any);
}
