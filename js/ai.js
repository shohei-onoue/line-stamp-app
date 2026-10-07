// AI画像生成（OpenAI Images API / edits）。APIキーは呼び出し元から渡され、api.openai.com 以外へは送らない。
window.LS = window.LS || {};

LS.AI = (() => {
  const ENDPOINT = 'https://api.openai.com/v1/images/edits';
  const FIDELITY_MODELS = /^gpt-image-1(\.5)?$/; // input_fidelity=high 対応モデル
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('画像の読み込みに失敗しました'));
      img.src = src;
    });
  }

  function errorMessage(status, json) {
    const msg = json?.error?.message || '';
    if (status === 401) return 'APIキーが無効です。';
    if (status === 403) return `このモデルを使う権限がありません（組織の認証が必要な場合があります）。${msg}`;
    if (status === 429) return `利用上限に達しました。時間をおくか、OpenAIの残高を確認してください。${msg}`;
    if (status === 400 && /safety|moderation/i.test(msg)) return '安全フィルタにより生成できませんでした。文言や指示を変えて再試行してください。';
    return `生成に失敗しました（${status}）${msg}`;
  }

  /**
   * 参照画像をもとに画像を生成
   * @param {{key:string, model:string, quality:string}} conf
   * @param {Blob[]} refs 参照画像（1枚目=キャラクター、2枚目=絵柄の見本）
   * @param {string} prompt
   * @returns {Promise<HTMLImageElement>} 透過PNG
   */
  async function edit(conf, refs, prompt, signal) {
    if (!conf.key) throw new Error('APIキーを入力してください。');
    const fd = new FormData();
    fd.append('model', conf.model);
    refs.forEach((r, i) => fd.append(refs.length > 1 ? 'image[]' : 'image', r, `reference${i + 1}.png`));
    fd.append('prompt', prompt);
    fd.append('size', '1024x1024');
    fd.append('quality', conf.quality);
    fd.append('background', 'transparent');
    fd.append('output_format', 'png');
    if (FIDELITY_MODELS.test(conf.model)) fd.append('input_fidelity', 'high');

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${conf.key}` }, body: fd, signal });
      if ((res.status === 429 || res.status >= 500) && attempt < 3) { await sleep(2000 * 2 ** attempt); continue; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errorMessage(res.status, json));
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) throw new Error('画像が返されませんでした。');
      return loadImage(`data:image/png;base64,${b64}`);
    }
  }

  /** 透明な余白を切り詰めた画像（dataURL）を返す */
  function trim(img, pad = 8) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return c.toDataURL('image/png');
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad);
    const out = document.createElement('canvas');
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  // ---- プロンプト ----
  function describe(a) {
    const E = LS.AVATAR_EN;
    return [
      `a ${E.height[a.height]}, ${E.bodyType[a.bodyType]} ${E.gender[a.gender]}`,
      `${E.hairStyle[a.hairStyle]} hair in color ${a.hairColor}`,
      `${E.eyeShape[a.eyeShape]} eyes with ${a.eyeColor} irises`,
      `skin tone ${a.skinColor}`,
      `wearing ${E.outfit[a.outfit]} in color ${a.outfitColor}`,
    ].join(', ');
  }
  const QUALITY = 'Professional, highly polished modern anime illustration quality: clean crisp lineart, '
    + 'detailed glossy hair with soft highlights, detailed eyes with gradient irises and catchlights, '
    + 'soft cel shading with gentle rim light, rich balanced colors, appealing well-proportioned anatomy. '
    + 'Wholesome and non-suggestive, everyday clothing worn neatly.';
  const STYLE_REF = 'Match the art style, rendering and finish quality of the second reference image (style reference only; do not copy its background or pose). ';
  const COMMON = 'Single character only, centered, fully inside the frame, fully transparent background, '
    + 'no text, no letters, no speech bubbles, no frame, no shadow on the ground. Suitable for a LINE messenger sticker.';

  /**
   * ③ キャラクター化
   * mode 'avatar': ①のアバター（＋任意で絵柄見本）から / 'character': 参考画像のキャラクターそのものを使う
   */
  function basePrompt(a, style, mode, hasStyleRef) {
    if (mode === 'character') {
      return 'Redraw the character from the reference image as a standalone sticker character: same face, hairstyle, hair color, eye color and outfit, '
        + `same art style. Remove the background. Full body, standing, friendly smile. ${QUALITY} ${COMMON}`;
    }
    return `Redraw the reference character as an original illustration in ${LS.STYLE_EN[style]}. `
      + `The character is ${describe(a)}. Keep these features and colors. ${hasStyleRef ? STYLE_REF : ''}`
      + `Full body, standing, friendly smile. ${QUALITY} ${COMMON}`;
  }

  /** ④/⑥ スタンプ1枚（キャラクター化した画像を参照） */
  const stickerPrompt = (a, style, item, extra = '', hasStyleRef = false) =>
    `Draw the exact same character as the reference image (same face, hair, eyes, outfit and art style: ${LS.STYLE_EN[style]}). `
    + `Expression: ${LS.EXPR_EN[item.expr]}. Pose: ${LS.POSE_EN[item.pose]}. `
    + `The situation is a chat reply meaning "${item.text.replace(/\n/g, ' ')}" (do not write it). `
    + `Upper body or full body, large and expressive. ${hasStyleRef ? STYLE_REF : ''}${extra ? `Additional instruction: ${extra}. ` : ''}${QUALITY} ${COMMON}`;

  /** 同時実行数を制限して順に処理 */
  async function pool(tasks, limit, signal) {
    let next = 0;
    const worker = async () => {
      while (next < tasks.length && !signal?.aborted) await tasks[next++]();
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  }

  return { edit, trim, loadImage, basePrompt, stickerPrompt, pool };
})();
