export function runScript<T = any>(
  code: string,
  requireOut?: NodeRequire,
  params: Record<string, any> = {},
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
    catch (e) {
      // ..
    }

    if (!result) {
      result = require(id);
    }

    return result;
  };

  const fake: FakeModule = {
    exports: {},
  } as any;

  const paramList = Object.keys(params);
  const paramValues = paramList.map((key) => params[key]);

  try {
    (new Function(`
      return function box(module, exports, require${paramList ? `, ${paramList.join(', ')}` : ''}) {
        ${code}
      }
    `))()(fake, fake.exports, requireFunc, ...paramValues);
  }
  catch (e: any) {
    throw new Error(e);
  }

  return (fake.exports.default ? fake.exports.default : fake.exports);
}
