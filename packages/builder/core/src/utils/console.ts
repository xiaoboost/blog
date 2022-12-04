import { isString } from '@xiao-ai/utils';

export function getPrefixConsole(prefix: string | (() => string)): Console {
  const getPrefix = isString(prefix) ? () => prefix : prefix;
  const keys = ['log', 'warn', 'error'] as const;
  const data: Console = {
    ...globalThis.console,
  };

  for (const key of keys) {
    data[key] = (...args: any[]) => {
      globalThis.console.log(getPrefix(), ...args);
    };
  }

  return data;
}
