interface SanBoxParams {
  names: string[];
  params: any[];
}

export function runScript<T = any>(code: string, params?: SanBoxParams): T {
  interface FakeModule {
    exports: {
      default: any;
    }
  }

  const fake: FakeModule = {
    exports: {},
  } as any;

  const paramList = params?.names.join(', ');

  try {
    (new Function(`
      return function box(module, exports, require${paramList ? `, ${paramList}` : ''}) {
        ${code}
      }
    `))()(fake, fake.exports, require, ...(params?.params ?? []));
  }
  catch (e) {
    throw new Error(e);
  }

  return (fake.exports.default ? fake.exports.default : fake.exports);
}
