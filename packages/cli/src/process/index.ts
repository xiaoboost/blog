import { cname } from './cname';
import { transform } from './template';

export async function build() {
  await cname();
  await transform();
}
