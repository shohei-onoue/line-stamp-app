// UI制御（ウィザード）
(() => {
  const { SPEC, STYLES, AVATAR_FIELDS, DEFAULT_AVATAR, SWATCHES, DEFAULT_SITUATIONS, TEXT_DEFAULTS, EXPRESSIONS, POSES, DECORATIONS, AI_DEFAULTS } = LS;
  const STORE_KEY = 'line-stamp-app:v2';
  const KEY_KEY = 'line-stamp-app:openai-key';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, '0');

  const state = {
    step: 1,
    avatar: { ...DEFAULT_AVATAR },
    style: 'cute',
    text: { ...TEXT_DEFAULTS },
    situations: DEFAULT_SITUATIONS.join('\n'),
    items: [],
    mainIndex: 0,
    tabIndex: 0,
    sheetDirty: true,
    selected: -1,
    ai: { ...AI_DEFAULTS },
    aiBase: null, // AIでキャラクター化した画像
    aiRef: null, // 参考画像（絵柄の見本 or キャラクター）
    aiAbort: null,
  };
  const cfg = () => ({ avatar: state.avatar, style: state.style, text: state.text, engine: state.ai.engine });
  const isAI = () => state.ai.engine === 'ai';

  // ---- 永続化（利便機能。失敗しても動作継続） ----
  const PERSIST = ['avatar', 'style', 'text', 'situations', 'mainIndex', 'tabIndex'];
  function save() {
    try {
      const data = Object.fromEntries(PERSIST.map((k) => [k, state[k]]));
      data.items = state.items.map(({ image, ai, aiSrc, ...rest }) => rest);
      const { key, ...aiConf } = state.ai;
      data.ai = aiConf;
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      if (state.ai.remember && key) localStorage.setItem(KEY_KEY, key);
      else localStorage.removeItem(KEY_KEY);
    } catch (_) { /* noop */ }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!d) return;
      PERSIST.forEach((k) => { if (d[k] !== undefined) state[k] = typeof d[k] === 'object' ? { ...state[k], ...d[k] } : d[k]; });
      if (Array.isArray(d.items)) state.items = d.items.map((it) => ({ ...it, image: null }));
      if (d.ai) Object.assign(state.ai, d.ai);
      state.ai.key = localStorage.getItem(KEY_KEY) || '';
    } catch (_) { /* noop */ }
  }

  // ---- 共通部品 ----
  function fillSelect(sel, map, value) {
    sel.innerHTML = '';
    Object.entries(map).forEach(([k, label]) => sel.add(new Option(label, k, false, String(k) === String(value))));
    return sel;
  }
  /** フォーム要素と state のプロパティを結ぶ */
  function bind(el, obj, key, onChange) {
    el.value = obj[key];
    el.addEventListener('input', () => { obj[key] = el.value; onChange(); save(); });
  }
  const toBlob = (cv) => new Promise((res) => cv.toBlob(res, 'image/png'));
  // Artifact（claude.ai公開版）上では downloads 機能で保存。ローカルでは通常のダウンロード。
  const IN_ARTIFACT = typeof window.claude?.use === 'function';
  async function download(blob, name) {
    if (IN_ARTIFACT) {
      const d = await window.claude.use('downloads');
      if (!d) throw new Error('この画面ではファイルを保存できません。');
      await d.save({ filename: name, data: blob }).catch((e) => { if (e.code !== 'declined') throw new Error(e.message || e.code); });
      return;
    }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const markDirty = () => { state.sheetDirty = true; };
  /** 2回押しで確定（confirm() が使えない環境でも動くように） */
  function armed(btn, label) {
    const reset = () => { delete btn.dataset.armed; btn.textContent = btn.dataset.label; };
    if (btn.dataset.armed) { reset(); return true; }
    btn.dataset.label = btn.textContent;
    btn.dataset.armed = '1';
    btn.textContent = label;
    setTimeout(() => btn.dataset.armed && reset(), 5000);
    return false;
  }

  // ---- ステップ切替 ----
  function go(step) {
    state.step = step;
    $$('[data-pane]').forEach((p) => (p.hidden = Number(p.dataset.pane) !== step));
    $$('#steps button').forEach((b) => b.classList.toggle('active', Number(b.dataset.step) === step));
    if (step === 3) renderStyles();
    if (step >= 4 && state.sheetDirty) renderSheet();
    if (step === 5) renderIcons();
    window.scrollTo(0, 0);
  }

  // ---- 1 アバター ----
  function buildAvatarForm() {
    const form = $('#avatar-form');
    AVATAR_FIELDS.forEach((f) => {
      const label = document.createElement('label');
      label.textContent = f.label + ' ';
      const el = f.type === 'color' ? Object.assign(document.createElement('input'), { type: 'color' }) : fillSelect(document.createElement('select'), f.options);
      el.dataset.avatar = f.key;
      bind(el, state.avatar, f.key, () => { markDirty(); renderAvatar(); });
      label.appendChild(el);
      form.appendChild(label);
    });
  }
  function renderAvatar() {
    LS.Renderer.toCanvas($('#avatar-preview'), SPEC.stamp.w, SPEC.stamp.h, { text: '', expr: 'happy', pose: 'wave', deco: 'none' }, cfg());
  }
  function randomize() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    AVATAR_FIELDS.forEach((f) => { state.avatar[f.key] = f.type === 'color' ? pick(SWATCHES[f.key]) : pick(Object.keys(f.options)); });
    $$('[data-avatar]').forEach((el) => (el.value = state.avatar[el.dataset.avatar]));
    markDirty(); renderAvatar(); save();
  }

  // ---- 2 シチュエーション ----
  function updateItems() {
    state.items = LS.Sheet.parseSituations(state.situations, state.items);
    const n = state.situations.split('\n').filter((l) => l.trim()).length;
    $('#situation-count').textContent = n === SPEC.count ? `${n} / ${SPEC.count} 行`
      : n < SPEC.count ? `${n} / ${SPEC.count} 行（不足分はサンプルで補完）` : `${n} 行（先頭${SPEC.count}行を使用）`;
    markDirty();
  }

  // ---- 3 タッチ ----
  function renderStyles() {
    const list = $('#style-list');
    list.innerHTML = '';
    Object.entries(STYLES).forEach(([key, st]) => {
      const btn = document.createElement('button');
      btn.className = 'style-card' + (key === state.style ? ' active' : '');
      const cv = document.createElement('canvas');
      cv.className = 'checker';
      LS.Renderer.toCanvas(cv, SPEC.stamp.w, SPEC.stamp.h, { text: 'よろしく！', expr: 'wink', pose: 'wave', deco: 'sparkle' }, { ...cfg(), style: key });
      btn.append(cv, Object.assign(document.createElement('span'), { textContent: st.label }));
      btn.addEventListener('click', () => { state.style = key; markDirty(); save(); renderStyles(); renderAvatar(); });
      list.appendChild(btn);
    });
  }

  // ---- 4-6 一覧・チェック・編集 ----
  function renderSheet() {
    LS.Sheet.render($('#sheet'), state.items, cfg());
    state.sheetDirty = false;
  }
  function buildGridOverlay() {
    const grid = $('#sheet-grid');
    grid.style.gridTemplateColumns = `repeat(${SPEC.sheet.cols}, 1fr)`;
    for (let i = 0; i < SPEC.count; i++) grid.appendChild(Object.assign(document.createElement('div'), { textContent: pad(i + 1) }));
  }
  function select(i) {
    state.selected = i;
    $$('#sheet-grid div').forEach((d, j) => d.classList.toggle('selected', j === i));
    $('#editor').hidden = i < 0;
    if (i < 0) return;
    const it = state.items[i];
    $('#edit-no').textContent = pad(i + 1);
    $('#edit-text').value = it.text;
    ['expr', 'pose', 'deco'].forEach((k) => ($(`#edit-${k}`).value = it[k]));
    $('#edit-image').value = '';
    $('#edit-ai-status').textContent = '';
    renderEditPreview();
  }
  function renderEditPreview() {
    LS.Renderer.toCanvas($('#edit-preview'), SPEC.stamp.w, SPEC.stamp.h, state.items[state.selected], cfg());
  }
  function applyEdit(patch) {
    const i = state.selected;
    const it = Object.assign(state.items[i], patch);
    if (patch.text !== undefined && it.aiSrc) LS.Store.set(`item:${i}`, { text: it.text, src: it.aiSrc });
    LS.Sheet.render($('#sheet'), state.items, cfg(), i);
    renderEditPreview();
    save();
  }
  /** 文言の手動変更を ② のテキストにも反映 */
  function syncSituations() {
    state.situations = state.items.map((it) => it.text.replace(/\n/g, '/')).join('\n');
    $('#situations').value = state.situations;
  }
  function bindEditor() {
    fillSelect($('#edit-expr'), EXPRESSIONS);
    fillSelect($('#edit-pose'), POSES);
    fillSelect($('#edit-deco'), DECORATIONS);
    $('#edit-text').addEventListener('input', (e) => { applyEdit({ text: e.target.value.replace(/[\/／]/g, '\n') }); syncSituations(); });
    ['expr', 'pose', 'deco'].forEach((k) => $(`#edit-${k}`).addEventListener('input', (e) => applyEdit({ [k]: e.target.value })));
    $('#edit-image').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(img.src); applyEdit({ image: img }); };
      img.src = URL.createObjectURL(f);
    });
    $('#edit-auto').addEventListener('click', () => { applyEdit({ ...LS.Sheet.infer(state.items[state.selected].text), image: null }); select(state.selected); });
    $('#edit-close').addEventListener('click', () => select(-1));
    $('#sheet-grid').addEventListener('click', (e) => select(LS.Sheet.hitTest($('#sheet'), e.clientX, e.clientY)));
  }

  // ---- AI生成 ----
  const aiConf = () => ({ key: state.ai.key.trim(), model: state.ai.model, quality: state.ai.quality });
  const imageBlob = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return toBlob(c); };

  function applyEngine() {
    $$('input[name=engine]').forEach((r) => (r.checked = r.value === state.ai.engine));
    $('#ai-panel').hidden = !isAI();
    $('#ai-generate').hidden = !isAI();
    $('#edit-ai').hidden = !isAI();
    showBase();
  }
  function showRef() {
    $('#ai-ref-row').hidden = !state.aiRef;
    if (state.aiRef) $('#ai-ref-img').src = state.aiRef.src;
  }
  /** 参考画像を読み込み（長辺1024pxに縮小してPNG化・保存） */
  async function setRef(file) {
    const raw = await LS.AI.loadImage(URL.createObjectURL(file));
    URL.revokeObjectURL(raw.src);
    const k = Math.min(1, 1024 / Math.max(raw.width, raw.height));
    const c = document.createElement('canvas');
    c.width = Math.round(raw.width * k); c.height = Math.round(raw.height * k);
    c.getContext('2d').drawImage(raw, 0, 0, c.width, c.height);
    const src = c.toDataURL('image/png');
    state.aiRef = await LS.AI.loadImage(src);
    LS.Store.set('ref', src);
    showRef();
  }
  function showBase() {
    const img = $('#ai-base-img');
    img.hidden = !state.aiBase;
    if (state.aiBase) img.src = state.aiBase.src;
  }

  /** ③ プログラム描画のアバターを参照してAIでキャラクター化 */
  async function makeBase() {
    const btn = $('#ai-base'), st = $('#ai-base-status');
    btn.disabled = true;
    st.textContent = '生成中…（数十秒かかります）';
    try {
      const asChar = state.aiRef && state.ai.refMode === 'character';
      const refs = [];
      if (asChar) refs.push(await imageBlob(state.aiRef));
      else {
        const av = LS.Renderer.toCanvas(document.createElement('canvas'), SPEC.stamp.w * 2, SPEC.stamp.h * 2, { text: '', expr: 'happy', pose: 'normal', deco: 'none' }, { ...cfg(), engine: 'program' });
        refs.push(await toBlob(av));
        if (state.aiRef) refs.push(await imageBlob(state.aiRef));
      }
      const img = await LS.AI.edit(aiConf(), refs, LS.AI.basePrompt(state.avatar, state.style, asChar ? 'character' : 'avatar', refs.length > 1));
      const src = LS.AI.trim(img);
      state.aiBase = await LS.AI.loadImage(src);
      LS.Store.set('base', src);
      showBase();
      st.textContent = '✅ 完成。気に入らなければもう一度押すと作り直します。';
    } catch (e) {
      st.textContent = `❌ ${e.message}`;
    } finally {
      btn.disabled = false;
    }
  }

  /** i番目をAI生成して一覧に反映 */
  async function genItem(i, extra = '', signal) {
    if (!state.aiBase) throw new Error('先に③で「AIでキャラクター化」を実行してください。');
    const it = state.items[i];
    const refs = [await imageBlob(state.aiBase)];
    if (state.aiRef) refs.push(await imageBlob(state.aiRef)); // 絵柄の見本として常に添える
    const img = await LS.AI.edit(aiConf(), refs, LS.AI.stickerPrompt(state.avatar, state.style, it, extra, refs.length > 1), signal);
    it.aiSrc = LS.AI.trim(img);
    it.ai = await LS.AI.loadImage(it.aiSrc);
    LS.Store.set(`item:${i}`, { text: it.text, src: it.aiSrc });
    LS.Sheet.render($('#sheet'), state.items, cfg(), i);
    if (state.selected === i) renderEditPreview();
  }

  async function generateMissing() {
    const todo = state.items.map((it, i) => (it.ai ? -1 : i)).filter((i) => i >= 0);
    const prog = $('#ai-progress');
    if (!todo.length) { prog.textContent = '全40枚生成済みです。作り直す場合は1枚ずつ編集画面から再生成してください。'; return; }
    if (!state.aiBase) { prog.textContent = '❌ 先に③で「AIでキャラクター化」を実行してください。'; return; }
    if (!armed($('#ai-generate'), `${todo.length}枚を生成（料金発生）→もう一度押す`)) return;
    const ctl = (state.aiAbort = new AbortController());
    $('#ai-generate').disabled = true;
    $('#ai-stop').hidden = false;
    let done = 0;
    const errors = [];
    const tick = () => (prog.textContent = `生成中 ${done}/${todo.length}` + (errors.length ? `（失敗 ${errors.length}）` : ''));
    tick();
    await LS.AI.pool(todo.map((i) => async () => {
      try { await genItem(i, '', ctl.signal); } catch (e) {
        if (e.name === 'AbortError') return;
        errors.push(`${pad(i + 1)}: ${e.message}`);
        if (/APIキー|権限/.test(e.message)) ctl.abort(); // 続けても失敗するので止める
      }
      done++; tick();
    }), LS.AI_CONCURRENCY, ctl.signal);
    prog.textContent = (ctl.signal.aborted ? '中止しました。' : `完了 ${done - errors.length}/${todo.length} 枚。`) + (errors.length ? `\n❌ ${errors.slice(0, 3).join('\n❌ ')}` : '');
    $('#ai-generate').disabled = false;
    $('#ai-stop').hidden = true;
    state.aiAbort = null;
  }

  async function regenSelected() {
    const st = $('#edit-ai-status'), btn = $('#edit-ai-regen');
    btn.disabled = true;
    st.textContent = '生成中…';
    try { await genItem(state.selected, $('#edit-ai-extra').value.trim()); st.textContent = '✅ 再生成しました。'; } catch (e) { st.textContent = `❌ ${e.message}`; } finally { btn.disabled = false; }
  }

  /** 保存済みのAI画像を復元（文言が変わったものは捨てる） */
  async function restoreAI() {
    const ref = await LS.Store.get('ref');
    if (ref) { state.aiRef = await LS.AI.loadImage(ref).catch(() => null); showRef(); }
    const base = await LS.Store.get('base');
    if (base) state.aiBase = await LS.AI.loadImage(base).catch(() => null);
    await Promise.all(state.items.map(async (it, i) => {
      const rec = await LS.Store.get(`item:${i}`);
      if (rec && rec.text === it.text) { it.aiSrc = rec.src; it.ai = await LS.AI.loadImage(rec.src).catch(() => null); }
    }));
    showBase();
    markDirty();
    if (state.step >= 4) renderSheet();
  }

  function bindAI() {
    if (IN_ARTIFACT) {
      state.ai.engine = 'program';
      const r = $('input[name=engine][value=ai]');
      r.disabled = true;
      r.parentElement.append(Object.assign(document.createElement('span'), { className: 'hint', textContent: '（この公開版では使えません。PCでZIP版を開くと使えます）' }));
    }
    $$('input[name=engine]').forEach((r) => r.addEventListener('change', () => { state.ai.engine = r.value; markDirty(); applyEngine(); save(); }));
    fillSelect($('[data-ai=model]'), LS.AI_MODELS);
    fillSelect($('[data-ai=quality]'), LS.AI_QUALITY);
    fillSelect($('[data-ai=refMode]'), LS.AI_REF_MODES);
    $('#ai-ref').addEventListener('change', (e) => e.target.files[0] && setRef(e.target.files[0]).catch((err) => ($('#ai-base-status').textContent = `❌ ${err.message}`)));
    $('#ai-ref-clear').addEventListener('click', () => { state.aiRef = null; $('#ai-ref').value = ''; LS.Store.set('ref', null); showRef(); });
    $$('[data-ai]').forEach((el) => bind(el, state.ai, el.dataset.ai, () => {}));
    bind($('#ai-key'), state.ai, 'key', () => {});
    $('#ai-remember').checked = state.ai.remember;
    $('#ai-remember').addEventListener('change', (e) => { state.ai.remember = e.target.checked; save(); });
    $('#ai-base').addEventListener('click', makeBase);
    $('#ai-generate').addEventListener('click', generateMissing);
    $('#ai-stop').addEventListener('click', () => state.aiAbort?.abort());
    $('#edit-ai-regen').addEventListener('click', regenSelected);
    applyEngine();
  }

  // ---- 7 保存 ----
  const iconCanvas = (cv, kind, i) => LS.Renderer.toCanvas(cv, SPEC[kind].w, SPEC[kind].h, state.items[i], cfg(), { withText: false, margin: kind === 'tab' ? 2 : 8 });
  function renderIcons() {
    const labels = Object.fromEntries(state.items.map((it, i) => [i, `${pad(i + 1)} ${it.text.replace(/\n/g, '')}`]));
    fillSelect($('#main-index'), labels, state.mainIndex);
    fillSelect($('#tab-index'), labels, state.tabIndex);
    iconCanvas($('#main-preview'), 'main', state.mainIndex);
    iconCanvas($('#tab-preview'), 'tab', state.tabIndex);
  }

  async function exportZip() {
    const btn = $('#export'), log = $('#log');
    btn.disabled = true;
    log.textContent = '生成中…';
    try {
      await document.fonts.ready;
      if (state.sheetDirty) renderSheet();
      const files = [], warns = [];
      const add = async (name, cv) => {
        const blob = await toBlob(cv);
        if (cv.width % 2 || cv.height % 2) warns.push(`${name}: サイズが奇数px`);
        if (blob.size > SPEC.maxBytes) warns.push(`${name}: 1MB超過 (${(blob.size / 1024).toFixed(0)}KB)`);
        files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
      };
      for (let i = 0; i < SPEC.count; i++) await add(`${pad(i + 1)}.png`, LS.Sheet.slice($('#sheet'), i));
      await add('main.png', iconCanvas(document.createElement('canvas'), 'main', state.mainIndex));
      await add('tab.png', iconCanvas(document.createElement('canvas'), 'tab', state.tabIndex));
      const zip = LS.Zip.create(files);
      await download(zip, 'line_stamps.zip');
      log.textContent = `✅ ${files.length}ファイル / ${(zip.size / 1024 / 1024).toFixed(2)}MB を出力しました。` + (warns.length ? `\n⚠ ${warns.join('\n⚠ ')}` : '');
    } catch (e) {
      log.textContent = `❌ 出力に失敗しました: ${e.message}`;
    } finally {
      btn.disabled = false;
    }
  }

  // ---- 起動 ----
  function bindAll() {
    $$('#steps button').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.step))));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.goto))));
    buildAvatarForm();
    $('#randomize').addEventListener('click', randomize);

    bind($('#situations'), state, 'situations', updateItems);
    $('#fill-sample').addEventListener('click', () => { $('#situations').value = state.situations = DEFAULT_SITUATIONS.join('\n'); updateItems(); save(); });

    $$('[data-text]').forEach((el) => bind(el, state.text, el.dataset.text, () => { markDirty(); renderStyles(); }));

    bindAI();
    buildGridOverlay();
    bindEditor();
    $('#regenerate').addEventListener('click', renderSheet);
    $('#download-sheet').addEventListener('click', async () => {
      try { await download(await toBlob($('#sheet')), 'line_stamps_sheet.png'); } catch (e) { $('#ai-progress').textContent = `❌ ${e.message}`; }
    });

    $('#main-index').addEventListener('input', (e) => { state.mainIndex = Number(e.target.value); renderIcons(); save(); });
    $('#tab-index').addEventListener('input', (e) => { state.tabIndex = Number(e.target.value); renderIcons(); save(); });
    $('#export').addEventListener('click', exportZip);
    $('#reset').addEventListener('click', () => {
      if (!armed($('#reset'), 'もう一度押すとすべて消去します')) return;
      try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(KEY_KEY); } catch (_) { /* noop */ }
      LS.Store.clear().finally(() => location.reload());
    });
  }

  // Webフォントはサブセット単位で遅延ロードされ、ロード中の文字はCanvasに描かれないため、ロード後に再描画する
  let redrawTimer;
  function redrawVisible() {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => {
      markDirty();
      if (state.step === 3) renderStyles();
      if (state.step >= 4) renderSheet();
      if (state.step === 4 && state.selected >= 0) renderEditPreview();
      if (state.step === 5) renderIcons();
    }, 50);
  }

  load();
  updateItems();
  bindAll();
  renderAvatar();
  document.fonts.addEventListener('loadingdone', redrawVisible);
  go(1);
  restoreAI();
  window.LS.App = { state, go, exportZip, select };
})();
