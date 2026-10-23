import React from 'react';
import styles from './index.jss';

export function Illustration() {
  return (
    <figure className={styles.classes.illustration} role="img" aria-label="404，一只猫躲在数字零后面，只露出轻轻摆动的尾巴">
      <svg viewBox="0 0 540 326" aria-hidden="true">
        <defs>
          {/* 两个 4 共用轮廓，所有图形共用同一坐标系。 */}
          <path id="not-found-four" fillRule="evenodd" d="M112 1H118V152H156V156H118V193C118 214 122 219 156 220V221H51V220C85 219 91 214 91 193V156H0V153ZM91 38 7 152H91Z" />
          <clipPath id="not-found-tail-root" clipPathUnits="userSpaceOnUse">
            <rect
              x="315"
              y="60"
              width="80"
              height="110"
            />
          </clipPath>
          <g id="not-found-paw">
            <path d="M-6 2C-8 6-6 10-3 10C-1 10-1 8 1 8C3 8 4 11 7 9C10 7 7 3 5 1C2-2-3-2-6 2Z" />
            <ellipse
              cx="-7"
              cy="-4"
              rx="2.3"
              ry="3.2"
              transform="rotate(-20 -7 -4)"
            />
            <ellipse
              cx="-1"
              cy="-7"
              rx="2.2"
              ry="3.1"
            />
            <ellipse
              cx="5"
              cy="-6"
              rx="2.2"
              ry="3.1"
              transform="rotate(18 5 -6)"
            />
            <ellipse
              cx="10"
              cy="-1"
              rx="2"
              ry="2.8"
              transform="rotate(32 10 -1)"
            />
          </g>
        </defs>
        {/* 裁切保持固定，只让尾巴在数字后面旋转。 */}
        <g clipPath="url(#not-found-tail-root)">
          <g className={styles.classes.tail}>
            <path className={styles.classes.tailOutline} d="M310 139C344 142 373 126 376 102C378 91 373 88 368 91C360 94 364 103 359 112C351 125 333 127 310 126Z" />
          </g>
        </g>
        <g className={styles.classes.digits}>
          <use href="#not-found-four" />
          <path fillRule="evenodd" d="M255 0C304 0 334 50 334 114C334 178 304 228 255 228C206 228 176 178 176 114C176 50 206 0 255 0ZM255 3C221 3 210 50 210 114C210 178 221 225 255 225C289 225 300 178 300 114C300 50 289 3 255 3Z" />
          <use href="#not-found-four" x="379" />
        </g>
        <g className={styles.classes.tracks}>
          <use href="#not-found-paw" transform="translate(332 214) rotate(-30) scale(1.25)" opacity=".35" />
          <use href="#not-found-paw" transform="translate(370 262) rotate(-38) scale(1.25)" opacity=".65" />
          <use href="#not-found-paw" transform="translate(415 301) rotate(-28) scale(1.25)" opacity=".8" />
        </g>
      </svg>
    </figure>
  );
}
