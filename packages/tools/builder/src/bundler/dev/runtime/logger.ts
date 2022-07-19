export function createLogger(name: string) {
  return (...messages: string[]) => {
    console.log(`[${name}]`, ...messages);
  };
}
