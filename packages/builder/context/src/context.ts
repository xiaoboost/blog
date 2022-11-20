import jss from 'jss';
import preset from 'jss-preset-default';

import * as styles from './styles';
import * as accessor from './accessor';

jss.setup(preset());

/** 运行上下文 */
export const RunContext = {
  [styles.JssKey]: jss,
  [accessor.MemoryKey]: accessor.Memory,
  Buffer,
  process,
};
