import { cname } from './cname';
import { buildTemplate } from './template';
import { write } from './files';

export async function build() {
  await cname();
  await buildTemplate((param) => {
    debugger;
    console.log(param);
  });
  await write();
}
