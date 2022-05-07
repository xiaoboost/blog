import createSpinner, { Ora } from 'ora';

const prefix = '>';
let spinner: Ora | undefined;

export const log = {
  log(...args: any[]) {
    console.log(prefix, ...args);
  },
  loadStart(message: string) {
    spinner = createSpinner({
      interval: 200,
      text: message,
    });
    spinner.start();
  },
  loadEnd() {
    if (spinner) {
      spinner.stop();
      spinner = undefined;
    }
  },
};
