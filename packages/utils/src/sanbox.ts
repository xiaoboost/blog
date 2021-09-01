interface SanBoxParams {
  names: string[];
  params: any[];
}

export function runScript<T = any>(
  code: string,
  requireOut?: NodeRequire,
  params?: SanBoxParams,
): T {
  interface FakeModule {
    exports: {
      default: any;
    }
  }

  const requireFunc = (id: string) => {
    let result: any;

    try {
      if (requireOut) {
        result = requireOut(id);
      }
    }
    catch(e) {}

    if (!result) {
      result = require(id);
    }

    return result;
  };

  const fake: FakeModule = {
    exports: {},
  } as any;

  const paramList = params?.names.join(', ');

  try {
    (new Function(`
      return function box(module, exports, require${paramList ? `, ${paramList}` : ''}) {
        ${code}
      }
    `))()(fake, fake.exports, requireFunc, ...(params?.params ?? []));
  }
  catch (e: any) {
    throw new Error(e);
  }

  return (fake.exports.default ? fake.exports.default : fake.exports);
}
