import React from 'react';
import styles from './index.jss';

export function Illustration() {
  return (
    <figure className={styles.classes.illustration} role="img" aria-label="404，一串猫脚印渐渐变淡，最后印在数字 0 上">
      <svg viewBox="0 0 540 366" aria-hidden="true">
        <defs>
          {/* 两个 4 共用轮廓。 */}
          <path id="not-found-four" fillRule="evenodd" d="M112 1H118V152H156V156H118V193C118 214 122 219 156 220V221H51V220C85 219 91 214 91 193V156H0V153ZM91 38 7 152H91Z" />
          <path id="not-found-zero" fillRule="evenodd" d="M255 0C304 0 334 50 334 114C334 178 304 228 255 228C206 228 176 178 176 114C176 50 206 0 255 0ZM255 3C221 3 210 50 210 114C210 178 221 225 255 225C289 225 300 178 300 114C300 50 289 3 255 3Z" />
          <clipPath id="not-found-zero-clip">
            <use href="#not-found-zero" clipRule="evenodd" />
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
        <g transform="translate(15 0)">
          <g className={styles.classes.digits}>
            <use href="#not-found-four" />
            <use href="#not-found-zero" />
            <use href="#not-found-four" x="354" />
          </g>
          <g className={styles.classes.inversePaw} clipPath="url(#not-found-zero-clip)">
            <use href="#not-found-paw" transform="translate(307 179) rotate(-30) scale(1.1)" />
          </g>
          <g className={styles.classes.tracks}>
            <use href="#not-found-paw" transform="translate(350 242) rotate(-30) scale(1.25)" opacity=".35" />
            <use href="#not-found-paw" transform="translate(408 288) rotate(-38) scale(1.25)" opacity=".55" />
            <use href="#not-found-paw" transform="translate(466 334) rotate(-28) scale(1.25)" opacity=".8" />
          </g>
        </g>
      </svg>
    </figure>
  );
}
