// AI生成画像の保存（IndexedDB）。使えない環境では何もしない。
window.LS = window.LS || {};

LS.Store = (() => {
  let dbp;
  const db = () => (dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('line-stamp-app', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('kv', mode);
      const req = fn(t.objectStore('kv'));
      t.oncomplete = () => res(req.result);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    get: (k) => tx('readonly', (s) => s.get(k)).catch(() => undefined),
    set: (k, v) => tx('readwrite', (s) => s.put(v, k)).catch(() => undefined),
    clear: () => tx('readwrite', (s) => s.clear()).catch(() => undefined),
  };
})();
