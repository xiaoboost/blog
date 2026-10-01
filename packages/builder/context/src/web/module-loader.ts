import { GlobalKey, getGlobalContext } from './constant';

export const ModuleLoader = /* @__PURE__ */ (() => getGlobalContext()[GlobalKey.ModuleLoader])();
