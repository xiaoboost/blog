export const isDevelopment = process.argv.includes('--development');
export const isProduction = !isDevelopment && process.argv.includes('--production');
export const isWatch = process.argv.includes('--watch');
export const isServer = process.argv.includes('--serve');
export const isTemplate = process.argv.includes('--template');
