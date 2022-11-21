import { StyleContext } from './styles';
import { MemoryContext } from './accessor';
import { getBuilderContext } from './builder';

type ContextParameters = Parameters<typeof getBuilderContext>;

/** 运行器上下文 */
export function getContext(...args: ContextParameters) {
  return {
    ...StyleContext,
    ...MemoryContext,
    ...getBuilderContext(...args),
  };
}
