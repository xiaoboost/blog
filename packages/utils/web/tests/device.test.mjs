import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as device from '../src/device.ts';

// 固定原 current-device 的分类结果，包括容易误判的 iPadOS 和混合 UA。
const cases = [
  [
    'Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0,
    ['isDesktop', 'isWindows'],
  ],
  [
    'Linux', 'Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64', 0,
    ['isDesktop'],
  ],
  [
    'Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0,
    ['isDesktop', 'isMacOS'],
  ],
  [
    'iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5,
    [
      'isIOS', 'isIPhone', 'isMacOS', 'isMobile',
    ],
  ],
  [
    'iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)', 'iPod', 5,
    [
      'isIOS', 'isIPhone', 'isIPod', 'isMacOS', 'isMobile',
    ],
  ],
  [
    'iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 'iPad', 5,
    [
      'isIOS', 'isIPad', 'isMacOS', 'isTablet',
    ],
  ],
  [
    'iPadOS desktop UA', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 5,
    [
      'isIOS', 'isIPad', 'isMacOS', 'isTablet',
    ],
  ],
  [
    'Android phone', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile', 'Linux armv8l', 5,
    [
      'isAndroid', 'isAndroidPhone', 'isMobile',
    ],
  ],
  [
    'Android tablet', 'Mozilla/5.0 (Linux; Android 14; Tablet)', 'Linux armv8l', 5,
    [
      'isAndroid', 'isAndroidTablet', 'isTablet',
    ],
  ],
  [
    'Windows touch', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Touch)', 'Win32', 10,
    [
      'isWindows', 'isWindowsTablet', 'isTablet',
    ],
  ],
  [
    'Windows phone with Android and iPhone tokens', 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; iPhone) Mobile', 'Win32', 5,
    [
      'isWindows', 'isWindowsPhone', 'isMobile',
    ],
  ],
  [
    'BlackBerry phone', 'Mozilla/5.0 (BB10; Touch) Mobile', '', 5,
    [
      'isBlackBerry', 'isBlackBerryPhone', 'isMobile',
    ],
  ],
  [
    'BlackBerry tablet', 'Mozilla/5.0 (BlackBerry; Tablet)', '', 5,
    [
      'isBlackBerry', 'isBlackBerryTablet', 'isTablet',
    ],
  ],
  [
    'Firefox OS phone', 'Mozilla/5.0 (Mobile; rv:18.0) Gecko/18.0 Firefox/18.0', '', 5,
    [
      'isFirefoxOS', 'isFirefoxOSPhone', 'isMobile',
    ],
  ],
  [
    'Firefox OS tablet', 'Mozilla/5.0 (Tablet; rv:18.0) Gecko/18.0 Firefox/18.0', '', 5,
    [
      'isFirefoxOS', 'isFirefoxOSTablet', 'isTablet',
    ],
  ],
  [
    'MeeGo', 'Mozilla/5.0 (MeeGo; NokiaN9)', '', 5,
    ['isMeeGo', 'isMobile'],
  ],
  [
    'TV', 'Mozilla/5.0 (SMARTTV; Linux)', '', 0,
    ['isTelevision', 'isDesktop'],
  ],
  [
    'Unknown', '', '', 0,
    ['isDesktop'],
  ],
];

for (const [
  name, userAgent, platform, maxTouchPoints, expected,
] of cases) {
  test(name, (t) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent, platform, maxTouchPoints },
    });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
      else delete globalThis.navigator;
    });

    for (const [key, predicate] of Object.entries(device)) {
      assert.equal(predicate(), expected.includes(key), `${name}: ${key}`);
    }
  });
}

test('import does not access browser globals', () => {
  const result = spawnSync(process.execPath, [
    '-e', `
    for (const name of ['navigator', 'window', 'document', 'screen']) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        get() { throw new Error('Unexpected access: ' + name); },
      });
    }
    require(process.argv[1]);
  `, fileURLToPath(new URL('../src/device.ts', import.meta.url)),
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
