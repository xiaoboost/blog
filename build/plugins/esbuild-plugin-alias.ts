import { Plugin } from 'esbuild';

export function aliasPlugin(modules = {}): Plugin {
  const aliases = Object.keys(modules).filter((alias) => modules[alias]);
  const empty = Object.keys(modules).filter((alias) => !modules[alias]);
  const aliasFilter = new RegExp(`^${aliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}$`);
  const emptyFilter = new RegExp(`^${empty.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}$`);

  return {
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: aliasFilter }, (args) => ({
        path: modules[args.path],
      }));

      build.onResolve({ filter: emptyFilter }, (args) => ({
        path: args.path,
        namespace: 'empty',
      }));

      build.onLoad({ filter: emptyFilter, namespace: 'empty' }, () => ({
        contents: 'export default {}\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
      }));
    },
  };
}
