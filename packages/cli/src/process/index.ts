import { cname } from './cname';
import { buildTemplate } from './template';

export async function build() {
  await cname();
  await buildTemplate((param) => {
    debugger;
    console.log(param);
  });
}
