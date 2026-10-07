# 公開手順（コード非公開＋本人だけログイン）

構成: GitHub（**Private**リポジトリ）→ Cloudflare Pages（自動公開）→ Cloudflare Access（本人のメールでログイン）。
- コードを見られるのは本人とClaudeだけ（Claudeはリポジトリ接続済み）。
- サイトを開けるのは、許可したメールで認証した本人だけ。
- Claudeがリポジトリを更新すると、Cloudflareが自動で公開し直す。
- 費用: いずれも無料枠内。

## 1. リポジトリを非公開にする（GitHub）

1. https://github.com/shohei-onoue/line-stamp-app/settings を開く。
2. 一番下の「Danger Zone」→「Change repository visibility」→ **Make private** → 確認。
3. Settings → Pages が有効なら「Unpublish site」で止める（Privateにすると無料プランでは自動で止まる）。

## 2. Cloudflare Pages で公開する

1. https://dash.cloudflare.com/sign-up でアカウント作成・ログイン。
2. 左メニュー「Workers & Pages」→「作成」→「Pages」→ **Gitに接続（Connect to Git）**。
3. GitHubを連携し、リポジトリへのアクセスは **Only select repositories → `line-stamp-app`** を選ぶ。
4. ビルド設定:
   - フレームワーク: なし（None）
   - ビルドコマンド: 空欄
   - ビルド出力ディレクトリ: `/`
5. 「保存してデプロイ」。`https://line-stamp-app-xxx.pages.dev` のURLが発行される。

## 3. 本人だけログインできるようにする（Cloudflare Access）

1. Pagesプロジェクト →「設定（Settings）」→「一般（General）」→「アクセスポリシー（Access policy）」を **有効化**。
2. 作成されたポリシーの許可メール（Include → Emails）を **自分のアドレスだけ** にして保存。
   - 初回はZero Trustのチーム名入力と無料プラン（Free）の選択を求められる。
3. 以後URLを開くとメール認証画面が出る。届いた6桁コードを入れた本人だけ使える。
4. 念のため、プレビュー用URL（`*.line-stamp-app-xxx.pages.dev`）にも同じポリシーがかかっていることを確認。

## 4. スマホのホーム画面に置く

1. スマホのブラウザ（iPhone: Safari / Android: Chrome）でURLを開き、メール認証する。
2. iPhone: 共有 →「ホーム画面に追加」／ Android: ︙ →「ホーム画面に追加」。
3. 「3 タッチ」→ AI生成 → APIキーを入力し「この端末にキーを保存」をオン。

## 補足

- APIキーと生成画像はスマホのブラウザ内だけに保存され、GitHub・Cloudflareには送られない。
- iPhoneはホーム画面アイコンから開くとSafariとは別の保存領域になる。キー入力や生成はホーム画面アイコン側で行う。
