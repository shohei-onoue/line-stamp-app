# スマホでAI生成まで使うための公開手順（Cloudflare・本人のみログイン）

所要: 初回のみ約10〜15分（PCで作業）。費用: 無料枠内。

## 1. サイトを公開する（Cloudflare Pages）

1. https://dash.cloudflare.com/sign-up でアカウントを作成してログイン。
2. 左メニュー「Workers & Pages」→「作成」→「Pages」→「アセットをアップロード（Upload assets）」。
3. プロジェクト名を入力（例: `my-line-stamp`）→ 作成。
4. `line-stamp-app.zip` を展開した **`line-stamp-app` フォルダの中身**（`index.html` がある階層）をドラッグ＆ドロップ →「デプロイ」。
5. `https://my-line-stamp.pages.dev` のようなURLが発行される。

## 2. 自分だけログインできるようにする（Cloudflare Access）

1. 公開したPagesプロジェクトの「設定（Settings）」→「一般（General）」→「アクセスポリシー（Access policy）」を **有効化**。
2. 作成されたポリシーを開き、許可するメールアドレス（Include → Emails）を **自分のアドレスだけ** にする。
3. 保存。以後、URLを開くとメール認証画面が出て、届いた6桁コードを入れた本人だけが使える。
   - 初めてZero Trustを使う場合、チーム名の設定と無料プラン（Free）の選択を求められる。

## 3. スマホのホーム画面に置く

1. スマホのブラウザ（iPhone: Safari / Android: Chrome）で上のURLを開き、メール認証する。
2. iPhone: 共有ボタン →「ホーム画面に追加」／ Android: ︙ →「ホーム画面に追加」。
3. 「3 タッチ」→ AI生成 → APIキーを入力し「この端末にキーを保存」をオン（自分のスマホだけなので可）。

## 更新するとき

新しい `line-stamp-app.zip` を受け取ったら、Pagesプロジェクトの「デプロイを作成」から同じようにフォルダをドロップする。URLとログイン設定はそのまま。

## 補足

- APIキーと生成画像はスマホのブラウザ内だけに保存され、Cloudflareには送られない。
- ホーム画面アイコンから開くと、ブラウザとは別の保存領域になる端末がある（iPhone）。キー入力・生成はホーム画面アイコン側で行う。
