import jss from 'jss';
import preset from 'jss-preset-default';

jss.setup(preset());

export default jss.createStyleSheet({
  box: {
    margin: 0,
    padding: 0,
    backgroundImage: `url('./example.svg')`,
  },
});
