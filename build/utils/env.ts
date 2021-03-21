export const isDevelopment = process.argv.includes('--development');
export const isProduction = !isDevelopment && process.argv.includes('--production');
export const isServer = process.argv.includes('--server');
export const isWatch = isDevelopment && process.argv.includes('--watch');
