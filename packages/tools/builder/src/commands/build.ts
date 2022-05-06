import { CommandOptions } from '../utils';
import { build as buildBlog } from '../bundler';

export async function build(opt: CommandOptions) {
  buildBlog(opt);
}
