/**
 * 按照有效数字的位数进行四舍五入。
 *  - 默认 6 位有效数字 [bits=6]
 *
 * @param {number} [bits=6]
 * @returns {number}
 */
export function toRound(origin: number, bits = 6) {
  if (Number.isNaN(origin)) {
    throw new Error('(number) Cannot run toRound(NaN)');
  }

  const value = Math.abs(origin);
  const toInt = Math.floor(Math.log10(value)) - bits + 1;
  const transform = 10 ** toInt;
  // round 一定是整数
  const round = String(Math.round(value / transform));
  // 原始数据符号
  const sign = origin < 0 ? '-' : '';

  // 插入小数点
  let str = '';
  if (toInt === 0) {
    str = round;
  } else if (toInt > 0) {
    str = round + '0'.repeat(toInt);
  } else if (-toInt >= bits) {
    str = `0.${'0'.repeat(-toInt - bits)}${round}`;
  } else {
    str = `${round.slice(0, toInt)}.${round.slice(toInt)}`;
  }

  return Number.parseFloat(sign + str);
}
