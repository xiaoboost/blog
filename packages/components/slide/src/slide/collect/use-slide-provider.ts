import { useRenderContext } from '@blog/context/runtime';
import { useContext, useRef } from 'react';
import {
  assertNoPosition,
  assertTime,
  mergeTransition,
  normalizeAction,
  normalizePosition,
} from '../../animation/normalize';
import { compileStep } from './compile';
import { SlideStoreContext, type ISlideStore } from './context';
import type {
  GroupKind,
  GroupScope,
  PlayerScope,
  SectionScope,
  StepScope,
} from './scope';

type Scope =
  | { kind: 'section'; value: SectionScope }
  | { kind: 'player'; value: PlayerScope }
  | { kind: 'step'; value: StepScope }
  | { kind: GroupKind; value: GroupScope };

/** PPT 储存器初始化 */
export function useSlideValue(): ISlideStore {
  const parent = useContext(SlideStoreContext);
  const renderContext = useRenderContext();
  const contextRef = useRef<ISlideStore | null>(null);

  if (parent) {
    throw new Error('[mdx-slide] Slide 不能嵌套。');
  }

  if (!contextRef.current) {
    const sections: SectionScope[] = [];
    const stack: Scope[] = [];
    const collecting = renderContext?.isPreBuild === true;

    function animationScope(component: string): StepScope {
      const current = stack.at(-1);

      if (current?.kind !== 'step' && current?.kind !== 'sequence' && current?.kind !== 'parallel') {
        throw new Error(`[mdx-slide] ${component} 必须属于 Step，可以嵌套在其 Sequence / Parallel 中。`);
      }

      return current.value;
    }

    contextRef.current = {
      collecting,
      beginSection() {
        if (stack.length) {
          throw new Error('[mdx-slide] Section 不能嵌套。');
        }

        const section = { index: sections.length };
        sections.push(section);
        stack.push({ kind: 'section', value: section });
        return section.index;
      },
      beginPlayer(props) {
        assertNoPosition(props);
        const parent = stack.at(-1);

        if (!parent) {
          throw new Error('[mdx-slide] Player 必须属于一个 Section。');
        }

        if (parent.kind !== 'section') {
          throw new Error('[mdx-slide] Player 不能嵌套。');
        }

        if (parent.value.player) {
          throw new Error(`[mdx-slide] 第 ${parent.value.index + 1} 页发现多个 Player，每个 Section 最多允许一个。`);
        }

        const player = { transition: mergeTransition(props.transition), steps: [] };
        parent.value.player = player;
        stack.push({ kind: 'player', value: player });
      },
      beginStep(props) {
        assertNoPosition(props);
        const parent = stack.at(-1);

        if (parent?.kind === 'step') {
          throw new Error('[mdx-slide] Step 不能嵌套。');
        }

        if (parent?.kind !== 'player') {
          throw new Error('[mdx-slide] Step 必须属于 Player。');
        }

        const step = {
          transition: mergeTransition(parent.value.transition, props.transition),
          children: [],
        };
        parent.value.steps.push(step);
        stack.push({ kind: 'step', value: step });
      },
      beginGroup(kind, props) {
        const parent = animationScope('Sequence / Parallel');

        if (props.id !== undefined && (typeof props.id !== 'string' || !props.id.trim())) {
          throw new Error('[mdx-slide] 分组 id 必须是非空字符串。');
        }

        const group: GroupScope = {
          kind,
          id: props.id,
          at: normalizePosition(props.at),
          transition: mergeTransition(parent.transition, props.transition),
          children: [],
        };
        parent.children.push(group);
        stack.push({ kind, value: group });
      },
      addAction(props) {
        assertNoPosition(props);
        const current = animationScope('Animate 或效果组件');
        const action = normalizeAction(props);
        current.children.push({
          kind: 'action',
          value: {
            ...action,
            transition: mergeTransition(current.transition, props.transition),
          },
        });
      },
      addWait(props) {
        assertNoPosition(props);
        const current = animationScope('Wait');
        assertTime(props.duration, 'Wait.duration');
        current.children.push({ kind: 'wait', duration: props.duration });
      },
      end(kind) {
        const current = stack.at(-1);

        if (current?.kind !== kind) {
          throw new Error(`[mdx-slide] ${kind} 范围没有按顺序结束。`);
        }

        if (collecting && current.kind === 'player' && !current.value.steps.length) {
          throw new Error('[mdx-slide] Player 至少需要一个 Step。');
        }

        stack.pop();
      },
      getConfig() {
        if (stack.length) {
          throw new Error('[mdx-slide] 范围尚未结束，不能生成配置。');
        }

        if (!sections.length) {
          throw new Error('[mdx-slide] PPT 必须包含一个 Slide 和至少一个 Section。');
        }

        return {
          sections: sections.map(({ player }, page) => ({
            steps: (player?.steps ?? []).map((step, index) => compileStep(step, `第 ${page + 1} 页 Step ${index + 1}`)),
          })),
        };
      },
    };
  }

  return contextRef.current;
}
