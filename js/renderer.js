// スタンプ1枚の合成（アバター＋装飾＋文言）
window.LS = window.LS || {};

LS.Renderer = (() => {
  /** 文言を box 内に収まる最大サイズで描画（縁取り2層） */
  function drawText(ctx, text, box, t) {
    const lines = String(text || '').split('\n').filter((l) => l.length);
    if (!lines.length) return;
    let size = (box.h / lines.length) * 0.92;
    const setFont = () => (ctx.font = `900 ${size}px ${t.font}`);
    setFont();
    const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 0.4;
    while (widest() > box.w && size > 8) { size -= 1; setFont(); }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const lh = size * 1.05;
    const top = box.y + box.h / 2 - (lh * (lines.length - 1)) / 2;
    const cx = box.x + box.w / 2;
    [[t.lineColor, size * 0.36], [t.outlineColor, size * 0.22]].forEach(([color, lw]) => lines.forEach((l, i) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.strokeText(l, cx, top + i * lh);
    }));
    ctx.fillStyle = t.textColor;
    lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lh));
    ctx.restore();
  }

  function fitImage(ctx, img, box) {
    const k = Math.min(box.w / img.width, box.h / img.height);
    const w = img.width * k, h = img.height * k;
    ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  }

  /**
   * 1枚を area に描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number,w:number,h:number}} area
   * @param {{text:string, expr:string, pose:string, deco:string, image?:HTMLImageElement, ai?:HTMLImageElement}} item
   * @param {{avatar:object, style:string, text:object, engine?:string}} cfg
   * @param {{withText?:boolean, margin?:number}} [opt]
   */
  function drawStamp(ctx, area, item, cfg, opt = {}) {
    const { withText = true, margin = LS.SPEC.stamp.margin } = opt;
    const inner = { x: area.x + margin, y: area.y + margin, w: area.w - margin * 2, h: area.h - margin * 2 };
    if (item.image) return fitImage(ctx, item.image, inner); // 個別差し替え画像
    const hasText = withText && item.text && item.text.trim();
    const lineCount = hasText ? item.text.trim().split('\n').length : 0;
    const textH = hasText ? inner.h * Math.min(0.28 + 0.12 * (lineCount - 1), 0.46) : 0;
    const overlap = textH * 0.4; // 文字を足元に重ねてキャラを大きく見せる
    const top = cfg.text.textPos === 'top';
    const charBox = { x: inner.x, w: inner.w, y: top ? inner.y + textH - overlap : inner.y, h: inner.h - textH + overlap };
    const textBox = { x: inner.x, w: inner.w, h: textH, y: top ? inner.y : inner.y + inner.h - textH };

    if (LS.Decor.isBack(item.deco)) LS.Decor.draw(ctx, charBox, item.deco);
    if (cfg.engine === 'ai' && item.ai) fitImage(ctx, item.ai, charBox); // AI生成キャラ
    else LS.Avatar.draw(ctx, charBox, cfg.avatar, cfg.style, { ...item, maxView: hasText ? 2.1 : undefined });
    if (!LS.Decor.isBack(item.deco)) LS.Decor.draw(ctx, charBox, item.deco);
    if (hasText) drawText(ctx, item.text, textBox, cfg.text);
  }

  /** 単体キャンバスに描画（main / tab / プレビュー用） */
  function toCanvas(canvas, w, h, item, cfg, opt) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    drawStamp(ctx, { x: 0, y: 0, w, h }, item, cfg, opt);
    return canvas;
  }

  return { drawStamp, toCanvas, drawText };
})();
