// 簡易認証モジュール
// ユーザーが設定したパスワードでアプリにアクセス制御をかけます

const LS_AUTH = {
  PASSWORD: 'line-stamp', // 初期パスワード（変更可能）
  SESSION_KEY: 'line-stamp-app:authenticated',

  init() {
    const overlay = document.getElementById('auth-overlay');
    const input = document.getElementById('auth-input');
    const button = document.getElementById('auth-button');
    const error = document.getElementById('auth-error');

    // 既に認証済みならオーバーレイを隠す
    if (sessionStorage.getItem(this.SESSION_KEY)) {
      overlay.hidden = true;
      document.body.style.overflow = 'auto';
      return;
    }

    // パスワード入力フォーム
    const handleSubmit = () => {
      const entered = input.value.trim();
      if (entered === this.PASSWORD) {
        sessionStorage.setItem(this.SESSION_KEY, '1');
        overlay.hidden = true;
        document.body.style.overflow = 'auto';
        input.value = '';
        error.hidden = true;
      } else {
        error.textContent = 'パスワードが間違っています';
        error.hidden = false;
        input.focus();
        input.select();
      }
    };

    button.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
    input.focus();

    // オーバーレイ表示
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
};

// ページロード時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LS_AUTH.init());
} else {
  LS_AUTH.init();
}
