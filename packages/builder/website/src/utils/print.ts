import Chalk from 'chalk';

let startTime = 0;

// export const Clear = () => console.log('\033[2J');

export const Doing = () => {
  startTime = Date.now();
  console.log(Chalk.greenBright(` ⚡ Compiling...`));
};

export const Done = () => {
  const end = Date.now();
  console.log(Chalk.greenBright(` ⚡ Compilation done in ${end - startTime}ms.`));
};

export const Serve = (port: number) => {
  const end = Date.now();
  console.log(Chalk.greenBright(
    ` ⚡ Compilation done in ${end - startTime}ms, ` +
    `website is set at http://localhost:${port}/.`
  ));
};
