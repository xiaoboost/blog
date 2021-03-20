import { cname } from './cname';
import { write } from './files';
import { buildTemplate, Template } from './template';

export async function build() {
  let template: Template;

  await cname();

  template = await buildTemplate((param) => {
    template = param;
  });

  await write();
}
