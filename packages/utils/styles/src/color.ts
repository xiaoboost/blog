import Color from 'color';

export { Color };

// 主要颜色定义
export const Shadow = Color(0xcccccc);
export const Blue = Color(0x1890ff);
export const BlueLight = Color(0x69c0ff);
export const Green = Color(0xbae637);
export const GreenLight = Color(0xeaff8f);
export const Gray = Color(0xe5e7eb);
export const GrayLight = Color(0xf3f4f6);
export const White = Color(0xffffff);
export const WhiteBg = Color(0xf7f7f7);
export const Red = Color(0xd41324);
export const RedLight = Color(0xff6969);
export const Yellow = Color(0xfdcb6e);
export const YellowLight = Color(0xffeaa7);
export const YellowLighter = Color(0xfef9ed);
export const Black = Color(0x303133);
export const BlackLight = Color(0x606266);
export const BlackLighter = Color(0x6b7280);
export const BlackExtraLight = Color(0xc0c4cc);

export const MainShadow = `
  0 2px 6px ${Color.rgb(0, 0, 0).alpha(0.06).toString()},
  0 1px 2px ${Color.rgb(0, 0, 0).alpha(0.08).toString()}
`;
