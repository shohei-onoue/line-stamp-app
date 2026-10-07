// 装飾描画。box はキャラ領域。
window.LS = window.LS || {};

LS.Decor = (() => {
  const TAU = Math.PI * 2;
  const { shape, heart } = LS.Draw;

  function star(ctx, x, y, s, inner = 0.45, n = 5) {
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2;
      const k = i % 2 ? s * inner : s;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * k, y + Math.sin(a) * k);
    }
    ctx.closePath();
  }

  function glyph(ctx, ch, x, y, size, fill, line, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `900 ${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.18;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(ch, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  const L = (b, fx, fy) => [b.x + b.w * fx, b.y + b.h * fy];
  const u = (b) => Math.min(b.w, b.h);

  const DRAW = {
    none: () => {},
    sparkle: (ctx, b) => [[0.12, 0.2, 0.09], [0.88, 0.15, 0.07], [0.85, 0.6, 0.05]].forEach(([fx, fy, k]) =>
      shape(ctx, '#ffd23f', '#fff', u(b) * 0.01, () => star(ctx, ...L(b, fx, fy), u(b) * k, 0.25, 4))),
    star: (ctx, b) => [[0.1, 0.25, 0.08], [0.9, 0.2, 0.07]].forEach(([fx, fy, k]) =>
      shape(ctx, '#ffc93c', '#fff', u(b) * 0.015, () => star(ctx, ...L(b, fx, fy), u(b) * k))),
    hearts: (ctx, b) => [[0.12, 0.3, 0.09], [0.88, 0.2, 0.11], [0.9, 0.55, 0.06]].forEach(([fx, fy, k]) =>
      shape(ctx, '#ff4d6d', '#fff', u(b) * 0.012, () => heart(ctx, ...L(b, fx, fy), u(b) * k))),
    sweat: (ctx, b) => {
      const [x, y] = L(b, 0.82, 0.3), s = u(b) * 0.07;
      shape(ctx, '#7cc8ff', '#fff', s * 0.15, () => {
        ctx.moveTo(x, y - s * 1.4);
        ctx.quadraticCurveTo(x + s, y, x, y + s * 0.8);
        ctx.quadraticCurveTo(x - s, y, x, y - s * 1.4);
      });
    },
    question: (ctx, b) => glyph(ctx, '?', ...L(b, 0.86, 0.22), u(b) * 0.3, '#4a90e2', null, 0.25),
    exclaim: (ctx, b) => glyph(ctx, '!', ...L(b, 0.86, 0.22), u(b) * 0.3, '#ff5a5f', null, 0.2),
    zzz: (ctx, b) => [[0.78, 0.3, 0.12], [0.86, 0.18, 0.16], [0.94, 0.05, 0.2]].forEach(([fx, fy, k]) =>
      glyph(ctx, 'Z', ...L(b, fx, fy), u(b) * k, '#6c7ae0', null, 0.2)),
    music: (ctx, b) => {
      glyph(ctx, '♪', ...L(b, 0.12, 0.25), u(b) * 0.2, '#ff8c42', null, -0.2);
      glyph(ctx, '♫', ...L(b, 0.88, 0.2), u(b) * 0.22, '#ff8c42', null, 0.2);
    },
    anger: (ctx, b) => {
      const [x, y] = L(b, 0.82, 0.2), s = u(b) * 0.06;
      ctx.save();
      ctx.lineCap = 'round';
      [0, 1, 2, 3].forEach((i) => shape(ctx, null, '#ff3b3b', s * 0.45, () => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const cx = x + Math.cos(a) * s * 1.1, cy = y + Math.sin(a) * s * 1.1;
        ctx.arc(cx, cy, s * 0.7, a + Math.PI * 0.6, a + Math.PI * 1.4);
      }));
      ctx.restore();
    },
    flowers: (ctx, b) => [[0.1, 0.3, '#ff9ecd'], [0.9, 0.22, '#ffd166']].forEach(([fx, fy, col]) => {
      const [x, y] = L(b, fx, fy), s = u(b) * 0.05;
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5;
        shape(ctx, col, '#fff', s * 0.15, () => ctx.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.7, 0, TAU));
      }
      shape(ctx, '#fff3b0', null, 0, () => ctx.arc(x, y, s * 0.55, 0, TAU));
    }),
    lines: (ctx, b) => {
      const cx = b.x + b.w / 2, cy = b.y + b.h * 0.55;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(80,80,80,0.55)';
      for (let i = 0; i < 16; i++) {
        const a = (i * TAU) / 16 + 0.1;
        ctx.lineWidth = u(b) * (i % 2 ? 0.012 : 0.02);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * b.w * 0.42, cy + Math.sin(a) * b.h * 0.48);
        ctx.lineTo(cx + Math.cos(a) * b.w * 0.5, cy + Math.sin(a) * b.h * 0.58);
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  /** 背面に描くか（集中線のみ背面） */
  const isBack = (key) => key === 'lines';

  function draw(ctx, box, key) {
    (DRAW[key] || DRAW.none)(ctx, box);
  }

  return { draw, isBack };
})();
