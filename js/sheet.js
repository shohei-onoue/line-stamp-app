// ②シチュエーション解析、④一覧画像生成、⑦切り分け
window.LS = window.LS || {};

LS.Sheet = (() => {
  const { stamp, sheet } = LS.SPEC;

  /** 文言から表情/ポーズ/装飾を推定 */
  function infer(text) {
    const hit = LS.RULES.find(([re]) => re.test(text));
    const [expr, pose, deco] = hit ? hit.slice(1) : LS.FALLBACK;
    return { expr, pose, deco };
  }

  /**
   * テキスト（1行1枚、"/" で改行）からスタンプ定義を作る。
   * 文言が同じ既存項目は手動編集を保持する。
   */
  function parseSituations(src, prev = []) {
    const lines = src.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, LS.SPEC.count);
    while (lines.length < LS.SPEC.count) lines.push(LS.DEFAULT_SITUATIONS[lines.length]);
    return lines.map((line, i) => {
      const text = line.replace(/[\/／]/g, '\n');
      const old = prev[i];
      if (old && old.text === text) return old;
      return { text, ...infer(line), image: null };
    });
  }

  const cellRect = (i) => ({ x: (i % sheet.cols) * stamp.w, y: Math.floor(i / sheet.cols) * stamp.h, w: stamp.w, h: stamp.h });

  /** 一覧画像（8列×5行）を描画。index 指定時はそのセルだけ再描画 */
  function render(canvas, items, cfg, index = null) {
    if (canvas.width !== stamp.w * sheet.cols) { canvas.width = stamp.w * sheet.cols; canvas.height = stamp.h * sheet.rows; }
    const ctx = canvas.getContext('2d');
    const targets = index === null ? items.map((_, i) => i) : [index];
    if (index === null) ctx.clearRect(0, 0, canvas.width, canvas.height);
    targets.forEach((i) => {
      const r = cellRect(i);
      ctx.save();
      ctx.clearRect(r.x, r.y, r.w, r.h);
      ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      LS.Renderer.drawStamp(ctx, r, items[i], cfg);
      ctx.restore();
    });
    return canvas;
  }

  /** 一覧画像から i 番目を切り出す */
  function slice(sheetCanvas, i) {
    const r = cellRect(i);
    const c = document.createElement('canvas');
    c.width = r.w; c.height = r.h;
    c.getContext('2d').drawImage(sheetCanvas, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return c;
  }

  /** 表示座標 → セル番号 */
  function hitTest(canvas, clientX, clientY) {
    const b = canvas.getBoundingClientRect();
    const col = Math.floor(((clientX - b.left) / b.width) * sheet.cols);
    const row = Math.floor(((clientY - b.top) / b.height) * sheet.rows);
    return col >= 0 && col < sheet.cols && row >= 0 && row < sheet.rows ? row * sheet.cols + col : -1;
  }

  return { infer, parseSituations, render, slice, hitTest, cellRect };
})();
