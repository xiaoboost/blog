const globalVarMap = new Map<string, any>();

export function setGlobalVar(key: string, val: any) {
  globalVarMap.set(key, val);
}

export function getGlobalVar<T = any>(key: string): T | undefined {
  return globalVarMap.get(key);
}
