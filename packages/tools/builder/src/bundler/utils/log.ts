const prefix = ' >';

export const log = {
  log(...args: any[]) {
    console.log(prefix, ...args);
  },
};
