// 간단한 HEX 색상 밝기 조절 유틸 (라이브러리 없이)
export function shadeHex(hex, percent) {
  const h = hex.replace('#', '');
  const num = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  );
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const amt = Math.round(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));

  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function palette3(baseHex) {
  return [shadeHex(baseHex, -25), baseHex, shadeHex(baseHex, 35)];
}
