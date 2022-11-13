import createSpinner, { Ora } from 'ora';
import Moment from 'moment';

let spinner: Ora | undefined;

export const logger = {
  log(...args: any[]) {
    console.log(`[${Moment().format('hh:mm:ss')}]`, ...args);
  },
  warn(...args: any[]) {
    console.warn(`[${Moment().format('hh:mm:ss')}]`, ...args);
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
