// 描画共通ユーティリティ
window.LS = window.LS || {};

LS.Draw = (() => {
  const TAU = Math.PI * 2;

  /** パスを描いて塗り/線を適用 */
  function shape(ctx, fill, stroke, lw, path) {
    ctx.beginPath();
    path();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  const ellipse = (ctx, x, y, rx, ry, rot = 0) => () => ctx.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot, 0, TAU);
  const circle = (ctx, x, y, r) => ellipse(ctx, x, y, r, r);

  function heart(ctx, x, y, s) {
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  }

  /** 折れ線の手足（縁取り付き） */
  function limb(ctx, pts, width, fill, line, lw) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); };
    if (lw) { path(); ctx.strokeStyle = line; ctx.lineWidth = width + lw * 2; ctx.stroke(); }
    path(); ctx.strokeStyle = fill; ctx.lineWidth = width; ctx.stroke();
    ctx.restore();
  }

  // ---- 色 ----
  const toRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
  /** c1 と c2 を t(0..1) で混色 */
  const mix = (c1, c2, t) => { const a = toRgb(c1), b = toRgb(c2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
  /** amt>0 で明るく、<0 で暗く */
  const shade = (c, amt) => mix(c, amt > 0 ? '#ffffff' : '#000000', Math.abs(amt));

  return { TAU, shape, ellipse, circle, heart, limb, mix, shade };
})();
