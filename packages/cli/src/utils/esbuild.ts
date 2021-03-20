import { BuildOptions } from 'esbuild';
import { isDevelopment, isProduction } from "./env";

export function mergeConfig(opt: BuildOptions = {}) {
  opt.format = opt.format ?? 'cjs';
  opt.target = opt.target ?? 'es6';
  opt.color = opt.color ?? true;
  opt.platform = opt.platform ?? 'browser';
  opt.external = (opt.external ?? []).concat(["esbuild"]);
  opt.mainFields = (opt.mainFields ?? []).concat(["source", "module", "main"]);

  opt.bundle = true;
  opt.logLevel = 'info';
  opt.treeShaking = true;
  
  if (!opt.outdir && !opt.outfile) {
    opt.outfile = 'dist/index.js';
  }
  
  if (isProduction) {
    opt.minify = opt.minify ?? true;
  }
  
  if (isDevelopment) {
    opt.define = {
      ...(opt.define ?? {}),
      ["process.env.NODE_ENV"]: '"development"',
    };
  
    opt.sourcemap = opt.sourcemap ?? true;
  }
  else if (isProduction) {
    opt.define = {
      ...(opt.define ?? {}),
      ["process.env.NODE_ENV"]: '"production"',
    };
  
    opt.sourcemap = opt.sourcemap ?? false;
  }
  
  return opt;
}
