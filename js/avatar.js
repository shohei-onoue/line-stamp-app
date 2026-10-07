// アバター描画。パーツ(avatar) × タッチ(style) × 表情(expr) × ポーズ(pose)
window.LS = window.LS || {};

LS.Avatar = (() => {
  const { TAU, shape, ellipse, circle, heart, limb, mix, shade } = LS.Draw;

  const HEIGHT = { short: 0.85, normal: 1, tall: 1.18 };
  const BODY = { slim: 0.82, normal: 1, chubby: 1.3 };
  const EYE_SHAPE = { round: { rot: 0, sq: 1 }, tsuri: { rot: -0.28, sq: 0.85 }, tare: { rot: 0.28, sq: 0.9 }, narrow: { rot: 0, sq: 0.5 } };
  // ポーズ: [左腕, 右腕] 各 [上腕角度, 前腕の曲げ]（度。0=真下、+で外側へ）
  const POSE = {
    normal: [[12, 0], [12, 0]], wave: [[12, 0], [145, 25]], banzai: [[155, 10], [155, 10]],
    point: [[12, 0], [80, 0]], please: [[18, -115], [18, -115]], fist: [[12, 0], [40, 120]],
    head: [[12, 0], [140, 95]], cheek: [[20, -140], [20, -140]],
  };
  const SLEEVE = { tshirt: 'short', hoodie: 'long', suit: 'long', dress: 'short', sailor: 'short' };
  const LONG_HAIR = { bob: 1, long: 1, ponytail: 1, twintail: 1, bun: 1 };

  /** タッチに応じた配色 */
  function palette(a, st) {
    const soft = (c) => (st.pastel ? mix(c, '#ffffff', st.pastel) : c);
    return {
      skin: soft(a.skinColor), hair: soft(a.hairColor), eye: soft(a.eyeColor), outfit: soft(a.outfitColor),
      line: st.line === 'hair' ? shade(a.hairColor, -0.45) : st.line,
      shadow: st.shading ? 'rgba(70,30,40,0.2)' : null,
    };
  }

  /** 体の寸法を計算 */
  function layout(box, a, st, maxView = Infinity) {
    const bodyHeads = (st.heads - 1) * HEIGHT[a.height];
    const total = 1 + bodyHeads + 0.12;
    const visible = Math.min(total, st.view || total, maxView);
    const H = Math.min(box.h / visible, box.w / 2.7);
    const cx = box.x + box.w / 2;
    const top = box.y + box.h - (visible - 0.12) * H;
    const rx = H * 0.5 * st.headW, ry = H * 0.5;
    const bodyL = bodyHeads * H;
    const torsoTop = top + H * 0.94;
    const torsoH = bodyL * 0.48;
    const tw = H * 0.3 * BODY[a.bodyType] * (a.gender === 'male' ? 1.08 : 1) * (0.7 + 0.3 * st.headW);
    return {
      H, cx, hx: cx, hy: top + ry, rx, ry, top, torsoTop, torsoH, tw,
      hipY: torsoTop + torsoH, legH: bodyL - torsoH + H * 0.04, feetY: top + (1 + bodyHeads) * H,
      arm: Math.min(torsoH * 0.5 + H * 0.1, H * 0.6), armW: H * 0.13 * Math.sqrt(BODY[a.bodyType]), lw: H * st.lw,
    };
  }

  // ---- 髪 ----
  function backHair(ctx, g, a, P) {
    const { hx, hy, rx, ry, lw, torsoTop, torsoH } = g;
    const fill = (path) => shape(ctx, P.hair, P.line, lw, path);
    const cap = ellipse(ctx, hx, hy - ry * 0.08, rx * 1.1, ry * 1.04);
    switch (a.hairStyle) {
      case 'bob': fill(() => ctx.roundRect(hx - rx * 1.16, hy - ry * 1.1, rx * 2.32, ry * 1.95, [rx, rx, rx * 0.35, rx * 0.35])); break;
      case 'long': fill(() => ctx.roundRect(hx - rx * 1.16, hy - ry * 1.1, rx * 2.32, torsoTop + torsoH * 0.75 - (hy - ry * 1.1), [rx, rx, rx * 0.5, rx * 0.5])); break;
      case 'ponytail':
        fill(ellipse(ctx, hx + rx * 1.0, hy + ry * 0.2, rx * 0.32, ry * 0.95, -0.35));
        fill(cap); break;
      case 'twintail':
        [-1, 1].forEach((d) => fill(ellipse(ctx, hx + d * rx * 1.18, hy + ry * 0.55, rx * 0.3, ry * 0.95, d * 0.2)));
        fill(cap);
        [-1, 1].forEach((d) => shape(ctx, '#ff5c7a', P.line, lw * 0.7, circle(ctx, hx + d * rx * 1.02, hy - ry * 0.25, rx * 0.11)));
        break;
      case 'bun':
        fill(circle(ctx, hx, hy - ry * 1.08, rx * 0.4));
        fill(cap); break;
      default: fill(cap);
    }
  }

  function frontHair(ctx, g, a, P, st) {
    const { hx, hy, rx, ry, lw } = g;
    const side = LONG_HAIR[a.hairStyle] ? 0.55 : 0.15;
    const hc = hy - ry * 0.05, rxx = rx * 1.07, ryy = ry * 1.05;
    const tipY = hy - ry * (a.hairStyle === 'short' ? 0.3 : 0.18), notchY = hy - ry * 0.48;
    shape(ctx, P.hair, P.line, lw, () => {
      ctx.moveTo(hx - rxx, hc + ry * side);
      ctx.ellipse(hx, hc, rxx, ryy, 0, Math.PI, TAU);
      ctx.lineTo(hx + rxx, hc + ry * side);
      ctx.lineTo(hx + rx * 0.82, hc + ry * side * 0.4);
      const n = 5;
      for (let i = 0; i <= n * 2; i++) {
        const x = hx + rx * 0.82 - (i * rx * 1.64) / (n * 2);
        ctx.lineTo(x, i % 2 ? tipY : notchY + (i === 0 || i === n * 2 ? ry * 0.2 : 0));
      }
      ctx.lineTo(hx - rx * 0.82, hc + ry * side * 0.4);
      ctx.closePath();
    });
    if (st.shine) {
      shape(ctx, null, mix(P.hair, '#ffffff', 0.45), ry * 0.07, () => ctx.ellipse(hx, hc, rx * 0.72, ry * 0.75, 0, Math.PI * 1.22, Math.PI * 1.42));
    }
  }

  // ---- 顔 ----
  function openEye(ctx, x, y, d, g, a, P, st, scale = 1) {
    const k = EYE_SHAPE[a.eyeShape];
    const w = g.rx * st.eyeW * scale, h = g.ry * st.eyeH * k.sq * scale, lw = g.lw;
    const dark = shade(P.eye, -0.6);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(k.rot * d);
    if (st.eye === 'dot') {
      shape(ctx, dark, null, 0, ellipse(ctx, 0, 0, w, h));
      shape(ctx, '#fff', null, 0, circle(ctx, -w * 0.3, -h * 0.35, w * 0.3));
    } else if (st.eye === 'anime') {
      shape(ctx, P.eye, P.line, lw * 0.6, ellipse(ctx, 0, 0, w, h));
      shape(ctx, dark, null, 0, ellipse(ctx, 0, h * 0.18, w * 0.5, h * 0.55));
      shape(ctx, '#fff', null, 0, circle(ctx, -w * 0.32, -h * 0.38, w * 0.32));
      shape(ctx, '#fff', null, 0, circle(ctx, w * 0.35, h * 0.4, w * 0.15));
      shape(ctx, null, P.line, lw * 1.5, () => ctx.ellipse(0, h * 0.05, w * 1.12, h * 1.1, 0, Math.PI * 1.08, Math.PI * 1.92));
    } else { // almond / sharp
      const almond = () => { ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, -h * 2, w, 0); ctx.quadraticCurveTo(0, h * 1.5, -w, 0); };
      shape(ctx, '#fff', null, 0, almond);
      ctx.save();
      ctx.beginPath(); almond(); ctx.clip();
      shape(ctx, P.eye, null, 0, circle(ctx, 0, h * 0.05, h * 1.05));
      shape(ctx, dark, null, 0, circle(ctx, 0, h * 0.05, h * 0.5));
      shape(ctx, '#fff', null, 0, circle(ctx, -h * 0.35, -h * 0.35, h * 0.25));
      ctx.restore();
      shape(ctx, null, P.line, lw * (st.eye === 'sharp' ? 1.6 : 1.4), () => { ctx.moveTo(-w * 1.1, h * 0.15); ctx.quadraticCurveTo(0, -h * 2.05, w * 1.1, -h * 0.1); });
      if (st.eye === 'almond') shape(ctx, null, P.line, lw * 0.6, () => { ctx.moveTo(-w * 0.7, -h * 1.3); ctx.quadraticCurveTo(0, -h * 2.1, w * 0.8, -h * 1.1); });
    }
    if (a.gender === 'female' && st.eye !== 'dot') {
      shape(ctx, null, P.line, lw * 0.9, () => {
        ctx.moveTo(d * w * 0.95, -h * 0.5); ctx.lineTo(d * w * 1.35, -h * 0.85);
        ctx.moveTo(d * w * 1.0, -h * 0.1); ctx.lineTo(d * w * 1.4, -h * 0.3);
      });
    }
    ctx.restore();
  }

  // 表情 → [目, 口, 眉の傾き, 追加]
  const FACES = {
    happy: ['open', 'smile', 0], laugh: ['arc', 'open', 0], wink: ['open|arc', 'smile', 0], love: ['heart', 'open', 0],
    sad: ['open', 'frown', -1], cry: ['flat', 'wave', -1, 'tears'], angry: ['open', 'frown', 1], surprised: ['big', 'o', 0],
    sleepy: ['flat', 'small', 0], shy: ['lt', 'wave', 0, 'blush'], think: ['open', 'slant', -0.5], smug: ['half', 'smirk', 1],
  };

  function eye(ctx, type, x, y, d, g, a, P, st) {
    const e = g.rx * 0.2, lw = g.lw * 1.3;
    const stroke = (path) => shape(ctx, null, P.line, lw, path);
    switch (type) {
      case 'open': return openEye(ctx, x, y, d, g, a, P, st);
      case 'big': return openEye(ctx, x, y, d, g, a, P, { ...st, eyeH: Math.max(st.eyeH, st.eyeW) * 0.9 }, 1.2);
      case 'half':
        openEye(ctx, x, y, d, g, a, P, st);
        shape(ctx, P.skin, null, 0, () => ctx.rect(x - e * 1.4, y - e * 1.8, e * 2.8, e * 1.7));
        return stroke(() => { ctx.moveTo(x - e * 1.1, y - e * 0.1); ctx.lineTo(x + e * 1.1, y - e * 0.1); });
      case 'arc': return stroke(() => ctx.arc(x, y + e * 0.4, e * 0.7, Math.PI * 1.15, Math.PI * 1.85));
      case 'flat': return stroke(() => { ctx.moveTo(x - e * 0.7, y); ctx.lineTo(x + e * 0.7, y); });
      case 'heart': return shape(ctx, '#ff4d6d', P.line, g.lw * 0.5, () => heart(ctx, x, y + e * 0.1, e * 1.0));
      case 'lt': return stroke(() => { ctx.moveTo(x - d * e * 0.6, y - e * 0.5); ctx.lineTo(x + d * e * 0.5, y); ctx.lineTo(x - d * e * 0.6, y + e * 0.5); });
      default: return null;
    }
  }

  function mouth(ctx, type, x, y, g, P, st) {
    const r = g.rx * st.mouth, lw = g.lw * 1.2;
    const red = '#e8566c';
    const m = {
      smile: () => shape(ctx, null, P.line, lw, () => ctx.arc(x, y - r * 0.12, r * 0.18, 0.18 * Math.PI, 0.82 * Math.PI)),
      open: () => shape(ctx, red, P.line, lw * 0.8, () => { ctx.arc(x, y - r * 0.06, r * 0.22, 0, Math.PI); ctx.closePath(); }),
      frown: () => shape(ctx, null, P.line, lw, () => ctx.arc(x, y + r * 0.14, r * 0.16, 1.2 * Math.PI, 1.8 * Math.PI)),
      o: () => shape(ctx, red, P.line, lw * 0.8, ellipse(ctx, x, y, r * 0.11, r * 0.14)),
      small: () => shape(ctx, red, P.line, lw * 0.6, circle(ctx, x, y, r * 0.06)),
      wave: () => shape(ctx, null, P.line, lw, () => {
        ctx.moveTo(x - r * 0.2, y);
        for (let i = 1; i <= 4; i++) ctx.lineTo(x - r * 0.2 + i * r * 0.1, y + (i % 2 ? -1 : 1) * r * 0.06);
      }),
      smirk: () => shape(ctx, null, P.line, lw, () => { ctx.moveTo(x - r * 0.14, y); ctx.quadraticCurveTo(x + r * 0.05, y + r * 0.06, x + r * 0.18, y - r * 0.07); }),
      slant: () => shape(ctx, null, P.line, lw, () => { ctx.moveTo(x - r * 0.12, y + r * 0.03); ctx.lineTo(x + r * 0.12, y - r * 0.03); }),
    };
    m[type]();
  }

  function face(ctx, g, a, P, st, expr) {
    const { hx, hy, rx, ry, lw } = g;
    const [eyes, mo, tilt, extra] = FACES[expr] || FACES.happy;
    const ey = hy + ry * st.eyeY, ex = rx * 0.42;
    const blush = st.blush || (extra === 'blush' ? 'rgba(255,110,130,0.45)' : null);
    if (blush) {
      const k = extra === 'blush' ? 1.4 : 1;
      [-1, 1].forEach((d) => shape(ctx, blush, null, 0, ellipse(ctx, hx + d * rx * 0.58, ey + ry * 0.28, rx * 0.17 * k, ry * 0.09 * k)));
    }
    if (extra === 'blush') {
      [-1, 1].forEach((d) => shape(ctx, null, '#e0607a', lw * 0.6, () => {
        for (let i = 0; i < 3; i++) {
          const x = hx + d * rx * 0.58 + (i - 1) * rx * 0.09;
          ctx.moveTo(x, ey + ry * 0.33); ctx.lineTo(x + rx * 0.05, ey + ry * 0.22);
        }
      }));
    }
    const [le, re] = eyes.includes('|') ? eyes.split('|') : [eyes, eyes];
    eye(ctx, le, hx - ex, ey, -1, g, a, P, st);
    eye(ctx, re, hx + ex, ey, 1, g, a, P, st);
    if (st.nose) shape(ctx, null, shade(P.skin, -0.35), lw * 0.9, () => { ctx.moveTo(hx + rx * 0.02, ey + ry * 0.2); ctx.lineTo(hx - rx * 0.03, ey + ry * 0.32); ctx.lineTo(hx + rx * 0.03, ey + ry * 0.33); });
    mouth(ctx, mo, hx, hy + ry * st.mouthY, g, P, st);
    if (extra === 'tears') {
      [-1, 1].forEach((d) => shape(ctx, 'rgba(90,170,255,0.85)', null, 0, () => ctx.rect(hx + d * ex - rx * 0.06, ey + ry * 0.04, rx * 0.12, ry * 0.75)));
    }
    return { ey, ex, tilt };
  }

  function brows(ctx, g, P, st, f) {
    const col = shade(P.hair, -0.35);
    [-1, 1].forEach((d) => shape(ctx, null, col, g.lw * (st.eye === 'sharp' ? 1.8 : 1.2), () => {
      const x = g.hx + d * f.ex, y = f.ey - g.ry * (st.eyeH + 0.2);
      const t = f.tilt * g.ry * 0.07;
      ctx.moveTo(x - d * g.rx * 0.16, y + t);
      ctx.lineTo(x + d * g.rx * 0.14, y - t * 0.6);
    }));
  }

  // ---- 体 ----
  function legs(ctx, g, a, P) {
    const { cx, tw, hipY, feetY, lw } = g;
    const skirt = a.outfit === 'dress' || a.outfit === 'sailor';
    const col = skirt ? P.skin : a.outfit === 'suit' ? shade(P.outfit, -0.15) : '#3d4f7a';
    const w = tw * 0.62;
    [-1, 1].forEach((d) => {
      const x = cx + d * tw * 0.42;
      limb(ctx, [[x, hipY - g.H * 0.05], [x, feetY - w * 0.4]], w, col, P.line, lw);
      shape(ctx, '#4a3b35', P.line, lw, ellipse(ctx, x + d * w * 0.15, feetY - w * 0.3, w * 0.62, w * 0.36));
    });
  }

  function torso(ctx, g, a, P) {
    const { cx, tw, torsoTop, torsoH, hipY, legH, lw, H } = g;
    const o = P.outfit, line = P.line;
    const body = (fill) => shape(ctx, fill, line, lw, () => ctx.roundRect(cx - tw, torsoTop, tw * 2, torsoH + H * 0.04, [tw * 0.55, tw * 0.55, tw * 0.25, tw * 0.25]));
    const skirt = (fill, len) => shape(ctx, fill, line, lw, () => {
      const y0 = torsoTop + torsoH * 0.6;
      ctx.moveTo(cx - tw * 0.92, y0); ctx.lineTo(cx + tw * 0.92, y0);
      ctx.lineTo(cx + tw * 1.45, hipY + legH * len); ctx.lineTo(cx - tw * 1.45, hipY + legH * len); ctx.closePath();
    });
    switch (a.outfit) {
      case 'hoodie':
        shape(ctx, shade(o, -0.12), line, lw, ellipse(ctx, cx, torsoTop + H * 0.02, tw * 0.95, H * 0.16));
        body(o);
        [-1, 1].forEach((d) => shape(ctx, null, '#fff', lw * 0.8, () => { ctx.moveTo(cx + d * tw * 0.2, torsoTop + H * 0.06); ctx.lineTo(cx + d * tw * 0.22, torsoTop + torsoH * 0.45); }));
        shape(ctx, null, shade(o, -0.25), lw * 0.8, () => ctx.roundRect(cx - tw * 0.55, torsoTop + torsoH * 0.62, tw * 1.1, torsoH * 0.28, tw * 0.1));
        break;
      case 'suit':
        body(o);
        shape(ctx, '#fff', line, lw * 0.6, () => { ctx.moveTo(cx - tw * 0.38, torsoTop); ctx.lineTo(cx + tw * 0.38, torsoTop); ctx.lineTo(cx, torsoTop + torsoH * 0.55); ctx.closePath(); });
        shape(ctx, '#d64545', line, lw * 0.5, () => { ctx.moveTo(cx, torsoTop + H * 0.04); ctx.lineTo(cx + tw * 0.1, torsoTop + torsoH * 0.35); ctx.lineTo(cx, torsoTop + torsoH * 0.5); ctx.lineTo(cx - tw * 0.1, torsoTop + torsoH * 0.35); ctx.closePath(); });
        break;
      case 'dress':
        skirt(o, 0.5);
        body(o);
        shape(ctx, null, shade(o, -0.2), lw, () => { ctx.moveTo(cx - tw * 0.95, torsoTop + torsoH * 0.6); ctx.lineTo(cx + tw * 0.95, torsoTop + torsoH * 0.6); });
        break;
      case 'sailor':
        skirt(o, 0.45);
        [-2, -1, 0, 1, 2].forEach((i) => shape(ctx, null, shade(o, -0.25), lw * 0.6, () => { ctx.moveTo(cx + i * tw * 0.2, torsoTop + torsoH * 0.7); ctx.lineTo(cx + i * tw * 0.32, hipY + legH * 0.42); }));
        body('#ffffff');
        shape(ctx, o, line, lw * 0.8, () => { ctx.moveTo(cx - tw * 0.95, torsoTop + H * 0.05); ctx.lineTo(cx + tw * 0.95, torsoTop + H * 0.05); ctx.lineTo(cx + tw * 0.35, torsoTop + torsoH * 0.35); ctx.lineTo(cx, torsoTop + torsoH * 0.5); ctx.lineTo(cx - tw * 0.35, torsoTop + torsoH * 0.35); ctx.closePath(); });
        shape(ctx, '#e04a5f', line, lw * 0.6, () => { const y = torsoTop + torsoH * 0.5; ctx.moveTo(cx, y); ctx.lineTo(cx - tw * 0.3, y - H * 0.07); ctx.lineTo(cx - tw * 0.3, y + H * 0.07); ctx.closePath(); ctx.moveTo(cx, y); ctx.lineTo(cx + tw * 0.3, y - H * 0.07); ctx.lineTo(cx + tw * 0.3, y + H * 0.07); ctx.closePath(); });
        break;
      default:
        body(o);
    }
    if (P.shadow) shape(ctx, P.shadow, null, 0, () => ctx.roundRect(cx - tw * 0.4, torsoTop, tw * 0.8, H * 0.08, tw * 0.2));
  }

  function arms(ctx, g, a, P, pose) {
    const { cx, tw, torsoTop, arm, armW, lw, H } = g;
    const sleeveCol = a.outfit === 'sailor' ? '#ffffff' : P.outfit;
    const long = SLEEVE[a.outfit] === 'long';
    (POSE[pose] || POSE.normal).forEach(([up, bend], i) => {
      const d = i ? 1 : -1;
      const sx = cx + d * (tw - armW * 0.35), sy = torsoTop + H * 0.1;
      const a1 = (up * Math.PI) / 180, a2 = ((up + bend) * Math.PI) / 180;
      const ex = sx + d * Math.sin(a1) * arm, ey = sy + Math.cos(a1) * arm;
      const hx = ex + d * Math.sin(a2) * arm * 0.95, hy = ey + Math.cos(a2) * arm * 0.95;
      const mx = sx + (ex - sx) * 0.55, my = sy + (ey - sy) * 0.55;
      limb(ctx, [[sx, sy], [ex, ey], [hx, hy]], armW, long ? sleeveCol : P.skin, P.line, lw);
      if (!long) limb(ctx, [[sx, sy], [mx, my]], armW * 1.15, sleeveCol, P.line, lw);
      shape(ctx, P.skin, P.line, lw, circle(ctx, hx, hy, armW * 0.62));
    });
  }

  /**
   * アバターを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number,w:number,h:number}} box
   * @param {object} a アバター設定（LS.DEFAULT_AVATAR の形）
   * @param {string} styleKey LS.STYLES のキー
   * @param {{expr?:string, pose?:string, maxView?:number}} [opt] maxView: 表示する最大頭身（下側を切る）
   */
  function draw(ctx, box, a, styleKey, opt = {}) {
    const st = LS.STYLES[styleKey] || LS.STYLES.cute;
    const g = layout(box, a, st, opt.maxView);
    const P = palette(a, st);
    ctx.save();
    ctx.beginPath(); // 足元側だけクリップ（上半身表示時の切り口）
    ctx.rect(box.x - box.w, box.y - box.h, box.w * 3, box.h * 2);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    backHair(ctx, g, a, P);
    legs(ctx, g, a, P);
    shape(ctx, P.skin, P.line, g.lw, () => ctx.rect(g.cx - g.rx * 0.18, g.hy + g.ry * 0.7, g.rx * 0.36, g.torsoTop - g.hy - g.ry * 0.6));
    torso(ctx, g, a, P);
    shape(ctx, P.skin, P.line, g.lw, ellipse(ctx, g.hx, g.hy, g.rx, g.ry));
    if (P.shadow) shape(ctx, P.shadow, null, 0, ellipse(ctx, g.hx, g.hy - g.ry * 0.45, g.rx * 0.85, g.ry * 0.2));
    const f = face(ctx, g, a, P, st, opt.expr || 'happy');
    frontHair(ctx, g, a, P, st);
    brows(ctx, g, P, st, f);
    arms(ctx, g, a, P, opt.pose || 'normal');
    ctx.restore();
    return g;
  }

  return { draw };
})();
