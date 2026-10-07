// 仕様・選択肢・プリセット（データのみ）
window.LS = window.LS || {};

LS.SPEC = {
  stamp: { w: 370, h: 320, margin: 10 }, // 最大370x320・偶数px・余白約10px
  main: { w: 240, h: 240 },
  tab: { w: 96, h: 74 },
  sheet: { cols: 8, rows: 5 }, // 一覧画像 8列×5行 = 40枚
  maxBytes: 1024 * 1024,
};
LS.SPEC.count = LS.SPEC.sheet.cols * LS.SPEC.sheet.rows;

// ---- ① アバターのパーツ ----
LS.AVATAR_FIELDS = [
  { key: 'gender', label: '性別', options: { female: '女性', male: '男性', other: 'その他' } },
  { key: 'hairStyle', label: '髪型', options: { short: 'ショート', bob: 'ボブ', long: 'ロング', ponytail: 'ポニーテール', twintail: 'ツインテール', bun: 'お団子' } },
  { key: 'hairColor', label: '髪色', type: 'color' },
  { key: 'eyeShape', label: '目の形', options: { round: 'まる目', tsuri: 'つり目', tare: 'たれ目', narrow: '細目' } },
  { key: 'eyeColor', label: '瞳の色', type: 'color' },
  { key: 'skinColor', label: '肌の色', type: 'color' },
  { key: 'outfit', label: '服装', options: { tshirt: 'Tシャツ', hoodie: 'パーカー', suit: 'スーツ', dress: 'ワンピース', sailor: 'セーラー服' } },
  { key: 'outfitColor', label: '服の色', type: 'color' },
  { key: 'height', label: '身長', options: { short: '低め', normal: '普通', tall: '高め' } },
  { key: 'bodyType', label: '体型', options: { slim: 'やせ型', normal: '普通', chubby: 'ぽっちゃり' } },
];

LS.DEFAULT_AVATAR = {
  gender: 'female', hairStyle: 'bob', hairColor: '#6b3f2a', eyeShape: 'round', eyeColor: '#3f7cc9',
  skinColor: '#ffe0c7', outfit: 'hoodie', outfitColor: '#ff9eb5', height: 'normal', bodyType: 'normal',
};

// ランダム生成で使う色候補
LS.SWATCHES = {
  hairColor: ['#2b2b2b', '#6b3f2a', '#a8703f', '#e8c070', '#c94f4f', '#7a5bd1', '#e88fb5', '#cfd3da'],
  eyeColor: ['#3f2a1e', '#3f7cc9', '#3d9a6b', '#a04ad1', '#d14a4a', '#d1a03f'],
  skinColor: ['#ffe9d9', '#ffe0c7', '#f5c9a6', '#d9a07a', '#a8714e'],
  outfitColor: ['#ff9eb5', '#7fb8ff', '#8fd19e', '#ffd166', '#b08cff', '#3a4a6b', '#ffffff', '#ff7b5c'],
};

// ---- ③ イラストのタッチ ----
// heads: 頭身 / view: 表示する頭身（超える分は下を切って上半身寄りに）/ headW: 顔の横幅 / lw: 線幅(頭高比) / line: 線色('hair'=髪色の濃い色) / eye: 目の描き方
// eyeW,eyeH: 目の大きさ(顔半径比) / eyeY: 目の高さ / mouth: 口サイズ / pastel: 淡色化 / shading: 影 / blush: 頬
LS.STYLES = {
  cute: { label: 'かわいい', heads: 2.5, headW: 1.0, lw: 0.035, line: '#4a3428', eye: 'anime', eyeW: 0.2, eyeH: 0.3, eyeY: 0.14, mouth: 0.8, mouthY: 0.52, pastel: 0, shading: false, shine: true, blush: 'rgba(255,120,140,0.45)' },
  real: { label: 'リアル', heads: 4.2, view: 2.5, headW: 0.8, lw: 0.016, line: '#3b2a22', eye: 'almond', eyeW: 0.2, eyeH: 0.1, eyeY: 0.06, mouth: 0.55, mouthY: 0.55, pastel: 0, shading: true, shine: true, nose: true, blush: 'rgba(230,120,120,0.15)' },
  yurufuwa: { label: 'ゆるふわ', heads: 2.1, headW: 1.08, lw: 0.022, line: 'hair', eye: 'dot', eyeW: 0.07, eyeH: 0.09, eyeY: 0.16, mouth: 0.6, mouthY: 0.48, pastel: 0.35, shading: false, shine: false, blush: 'rgba(255,140,160,0.5)' },
  anime: { label: 'アニメ（高品質）', heads: 3.0, view: 2.6, headW: 0.92, lw: 0.022, line: '#2b2230', eye: 'anime', eyeW: 0.2, eyeH: 0.24, eyeY: 0.1, mouth: 0.6, mouthY: 0.52, pastel: 0, shading: true, shine: true, nose: true, blush: 'rgba(255,120,140,0.3)' },
  serious: { label: 'シリアス', heads: 3.2, view: 2.5, headW: 0.88, lw: 0.04, line: '#141414', eye: 'sharp', eyeW: 0.24, eyeH: 0.13, eyeY: 0.06, mouth: 0.6, mouthY: 0.52, pastel: 0, shading: true, shine: true, nose: true, blush: null },
};

// ---- 表情・ポーズ・装飾 ----
LS.EXPRESSIONS = {
  happy: 'にっこり', laugh: '大笑い', wink: 'ウインク', love: 'ハート目',
  sad: 'かなしい', cry: '号泣', angry: '怒り', surprised: 'びっくり',
  sleepy: 'ねむい', shy: '照れ', think: '考え中', smug: 'ドヤ',
};
LS.POSES = {
  normal: '気をつけ', wave: '手を振る', banzai: 'バンザイ', point: '指さし',
  please: 'お願い', fist: 'ガッツポーズ', head: '頭に手', cheek: '両手ほっぺ',
};
LS.DECORATIONS = {
  none: 'なし', sparkle: 'キラキラ', hearts: 'ハート', sweat: '汗',
  question: '？', exclaim: '！', zzz: 'Zzz', music: '♪',
  anger: '怒りマーク', flowers: 'お花', star: '星', lines: '集中線',
};

// ---- ② シチュエーション → 表情/ポーズ/装飾 の自動割当（上から順に最初の一致を採用） ----
LS.RULES = [
  [/おはよ/, 'happy', 'wave', 'sparkle'], [/こんにち|こんばん/, 'happy', 'wave', 'flowers'],
  [/おやすみ|ねむ|眠/, 'sleepy', 'normal', 'zzz'], [/ありがと|感謝|サンキュ/, 'happy', 'please', 'hearts'],
  [/ごめん|すみません|すいません|失礼/, 'sad', 'head', 'sweat'], [/お願い|おねが|頼/, 'shy', 'please', 'sparkle'],
  [/OK|ok|了解|りょ|承知|わかった/, 'smug', 'fist', 'sparkle'], [/よろしく/, 'wink', 'wave', 'star'],
  [/いいね|グッド|ナイス/, 'laugh', 'fist', 'star'], [/おめでと|祝/, 'laugh', 'banzai', 'star'],
  [/すご|最高|天才/, 'surprised', 'banzai', 'sparkle'], [/おつかれ|お疲れ/, 'happy', 'wave', 'flowers'],
  [/がんば|頑張|ファイト/, 'smug', 'fist', 'lines'], [/待って|まって|ストップ/, 'surprised', 'point', 'exclaim'],
  [/向かって|今行く|いまいく/, 'smug', 'point', 'lines'], [/びっくり|えっ|まじ|マジ/, 'surprised', 'banzai', 'exclaim'],
  [/どこ|なに|何|？|\?/, 'think', 'head', 'question'], [/考え|うーん|なるほど/, 'think', 'head', 'question'],
  [/うれし|嬉し|たのし|楽し|やった/, 'laugh', 'banzai', 'music'], [/好き|すき|ラブ|愛/, 'love', 'cheek', 'hearts'],
  [/照れ|てれ|恥/, 'shy', 'cheek', 'hearts'], [/笑|ｗ|www|草/, 'laugh', 'normal', 'none'],
  [/ぴえん|泣|号泣|つら/, 'cry', 'normal', 'none'], [/かなし|悲し|しょんぼり/, 'sad', 'normal', 'none'],
  [/ムカ|怒|おこ|NO|ダメ|だめ/, 'angry', 'fist', 'anger'], [/おなか|お腹|はら/, 'sad', 'normal', 'sweat'],
  [/はーい|はい/, 'happy', 'banzai', 'music'], [/ドンマイ|大丈夫/, 'wink', 'point', 'star'],
  [/またね|バイ|ばいばい|じゃあね/, 'wink', 'wave', 'sparkle'],
];
LS.FALLBACK = ['happy', 'normal', 'none'];

LS.DEFAULT_SITUATIONS = [
  'おはよう', 'こんにちは', 'おやすみ', 'ありがとう', 'ありがとう/ございます', 'よろしく！', 'OK!', '了解です',
  'いいね！', 'すごい！', 'おつかれさま', 'がんばって', 'ファイト！', 'おめでとう', 'ごめんね', 'すみません',
  'ちょっと/待って', '今向かってる', '今どこ？', 'なるほど', 'えっ!?', 'うれしい', 'たのしい♪', '大好き',
  'ラブ', '笑', 'かなしい', 'ぴえん', 'ムカッ', 'びっくり', 'ねむい…', 'おなか/すいた',
  'お願い！', 'はーい', 'NO!', 'ドンマイ', '照れる', '考え中…', 'よろしく/お願いします', 'またね',
];

LS.TEXT_DEFAULTS = {
  textColor: '#ff6f61', outlineColor: '#ffffff', lineColor: '#5a3e2b', textPos: 'bottom',
  font: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif',
};

// ---- AI生成（OpenAI Images API）----
LS.AI_DEFAULTS = { engine: 'program', model: 'gpt-image-1.5', quality: 'high', refMode: 'style', key: '', remember: false };
LS.AI_REF_MODES = { style: '絵柄・クオリティだけ参考にする', character: 'このキャラクターでスタンプを作る' };
LS.AI_MODELS = { 'gpt-image-1.5': 'gpt-image-1.5（推奨）', 'gpt-image-2': 'gpt-image-2', 'gpt-image-1-mini': 'gpt-image-1-mini（安価）', 'gpt-image-1': 'gpt-image-1' };
LS.AI_QUALITY = { low: '低（安い・速い）', medium: '中', high: '高（高い・遅い）' };
LS.AI_CONCURRENCY = 3;

// プロンプト用の英語表現
LS.AVATAR_EN = {
  gender: { female: 'girl', male: 'boy', other: 'androgynous young person' },
  hairStyle: { short: 'short', bob: 'bob-cut', long: 'long straight', ponytail: 'ponytail', twintail: 'twin-tails', bun: 'bun (odango)' },
  eyeShape: { round: 'big round', tsuri: 'upturned (tsurime)', tare: 'droopy gentle (tareme)', narrow: 'narrow' },
  outfit: { tshirt: 'a T-shirt and jeans', hoodie: 'a hoodie and jeans', suit: 'a business suit with a tie', dress: 'a one-piece dress', sailor: 'a Japanese sailor school uniform' },
  height: { short: 'short', normal: 'average-height', tall: 'tall' },
  bodyType: { slim: 'slim', normal: 'average-build', chubby: 'chubby' },
};
LS.STYLE_EN = {
  cute: 'cute chibi anime style, big sparkling eyes, thick soft outlines, flat pastel cel shading',
  real: 'semi-realistic illustration style, realistic proportions, detailed painterly shading',
  yurufuwa: 'loose fluffy hand-drawn style, simple dot eyes, soft pastel colors, thin wobbly lines',
  anime: 'high-quality modern Japanese anime key-visual style, glossy detailed hair, large detailed eyes, soft cel shading with rim light',
  serious: 'sharp dramatic anime style, bold black outlines, high-contrast cel shading',
};
LS.EXPR_EN = {
  happy: 'gentle happy smile', laugh: 'laughing with mouth open, eyes closed', wink: 'playful wink', love: 'heart-shaped eyes, in love',
  sad: 'sad, downcast', cry: 'crying with streaming tears', angry: 'angry, puffed cheeks, furrowed brows', surprised: 'shocked, wide eyes, open mouth',
  sleepy: 'sleepy, half-closed eyes, yawning', shy: 'shy, blushing', think: 'thinking, puzzled', smug: 'confident smug grin',
};
LS.POSE_EN = {
  normal: 'standing naturally', wave: 'waving one hand', banzai: 'both arms raised in joy', point: 'pointing forward',
  please: 'hands pressed together, pleading', fist: 'fist pump, determined', head: 'hand on head', cheek: 'both hands on cheeks',
};
