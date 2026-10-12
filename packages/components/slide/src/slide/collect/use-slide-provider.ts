import { useRenderContext } from '@blog/context/runtime';
import { useContext, useRef } from 'react';
import { mergeTransition } from '../../animation/normalize';
import { SlideStoreContext, type ISlideStore } from './context';
import type { PlayerScope, SectionScope, StepScope } from './scope';

type Scope =
  | { kind: 'section'; value: SectionScope }
  | { kind: 'player'; value: PlayerScope }
  | { kind: 'step'; value: StepScope };

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

    contextRef.current = {
      beginSection() {
        if (stack.length) {
          throw new Error('[mdx-slide] Section 不能嵌套。');
        }

        const section = { ...metadata, index: sections.length };
        sections.push(section);
        stack.push({ kind: 'section', value: section });
        return section.index;
      },
      beginPlayer(transition) {
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

        const player = { transition: mergeTransition(transition), steps: [] };
        parent.value.player = player;
        stack.push({ kind: 'player', value: player });
      },
      beginStep(transition) {
        const parent = stack.at(-1);

        if (parent?.kind === 'step') {
          throw new Error('[mdx-slide] Step 不能嵌套。');
        }

        if (parent?.kind !== 'player') {
          throw new Error('[mdx-slide] Step 必须属于 Player。');
        }

        const step = { transition: mergeTransition(parent.value.transition, transition), actions: [] };
        parent.value.steps.push(step);
        stack.push({ kind: 'step', value: step });
      },
      addAction(action) {
        const current = stack.at(-1);

        if (current?.kind !== 'step') {
          throw new Error('[mdx-slide] Animate 或效果组件必须属于 Step。');
        }

        current.value.actions.push({ ...action, transition: mergeTransition(current.value.transition, action.transition) });
      },
      end(kind) {
        const current = stack.at(-1);

        if (current?.kind !== kind) {
          throw new Error(`[mdx-slide] ${kind} 范围没有按顺序结束。`);
        }

        if (collecting && current.kind === 'player' && !current.value.steps.length) {
          throw new Error('[mdx-slide] Player 至少需要一个 Step。');
        }

        if (current.kind === 'step' && !current.value.actions.length) {
          throw new Error('[mdx-slide] Step 没有动作。');
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
          version: 1,
          ...slideSize,
          sections: sections.map(({ id, title, player }) => ({
            ...(id === undefined ? {} : { id }),
            ...(title === undefined ? {} : { title }),
            steps: (player?.steps ?? []).map(({ actions }) => ({ actions })),
          })),
        };
      },
    };
  }

  return contextRef.current;
}
