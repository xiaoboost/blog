/**
 * 设备判断规则改编自 current-device 0.10.2（Matthew Hudson）
 */

function hasUserAgent(value: string): boolean {
  return navigator.userAgent.toLowerCase().includes(value);
}

export function isMacOS(): boolean {
  return hasUserAgent('mac');
}

export function isIOS(): boolean {
  return isIPhone() || isIPod() || isIPad();
}

export function isIPhone(): boolean {
  return !isWindows() && hasUserAgent('iphone');
}

export function isIPod(): boolean {
  return hasUserAgent('ipod');
}

export function isIPad(): boolean {
  // iPadOS 可能使用桌面版 Safari 的 UA，需要结合平台和触摸点判断。
  return hasUserAgent('ipad') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return !isWindows() && hasUserAgent('android');
}

export function isAndroidPhone(): boolean {
  return isAndroid() && hasUserAgent('mobile');
}

export function isAndroidTablet(): boolean {
  return isAndroid() && !hasUserAgent('mobile');
}

export function isBlackBerry(): boolean {
  return hasUserAgent('blackberry') || hasUserAgent('bb10');
}

export function isBlackBerryPhone(): boolean {
  return isBlackBerry() && !hasUserAgent('tablet');
}

export function isBlackBerryTablet(): boolean {
  return isBlackBerry() && hasUserAgent('tablet');
}

export function isWindows(): boolean {
  return hasUserAgent('windows');
}

export function isWindowsPhone(): boolean {
  return isWindows() && hasUserAgent('phone');
}

export function isWindowsTablet(): boolean {
  return isWindows() && hasUserAgent('touch') && !isWindowsPhone();
}

export function isFirefoxOS(): boolean {
  return (hasUserAgent('(mobile') || hasUserAgent('(tablet')) && hasUserAgent(' rv:');
}

export function isFirefoxOSPhone(): boolean {
  return isFirefoxOS() && hasUserAgent('mobile');
}

export function isFirefoxOSTablet(): boolean {
  return isFirefoxOS() && hasUserAgent('tablet');
}

export function isMeeGo(): boolean {
  return hasUserAgent('meego');
}

export function isMobile(): boolean {
  return isAndroidPhone() || isIPhone() || isIPod() || isWindowsPhone()
    || isBlackBerryPhone() || isFirefoxOSPhone() || isMeeGo();
}

export function isTablet(): boolean {
  return isIPad() || isAndroidTablet() || isBlackBerryTablet()
    || isWindowsTablet() || isFirefoxOSTablet();
}

/** 沿用原库定义：既不是手机也不是平板；不代表设备一定有鼠标。 */
export function isDesktop(): boolean {
  return !isTablet() && !isMobile();
}

export function isTelevision(): boolean {
  return [
    'googletv', 'viera', 'smarttv', 'internet.tv', 'netcast', 'nettv', 'appletv',
    'boxee', 'kylo', 'roku', 'dlnadoc', 'pov_tv', 'hbbtv', 'ce-html',
  ].some(hasUserAgent);
}
