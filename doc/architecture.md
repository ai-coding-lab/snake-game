# アーキテクチャドキュメント

## ディレクトリ構成

```
snake-game/
├── PROMPT.md           # 要求仕様
├── README.md           # プロジェクト概要
├── CONVERSATION.md     # 対話ログ
├── Dockerfile          # コンテナイメージ定義
├── docker-compose.yml  # コンテナ実行設定
├── .gitignore          # 除外ファイル設定
├── doc/
│   └── architecture.md # 本ドキュメント
└── src/
    ├── index.html      # メインページ
    ├── style.css       # スタイルシート
    ├── game.js         # ゲームロジック
    └── summary.html    # プロンプト要約ページ
```

## 使用ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| なし | - | バニラ JavaScript で実装 |

外部ライブラリは一切使用せず、HTML5 Canvas API と標準 JavaScript のみで構成。

## コンテナレベルのデータフロー

```mermaid
flowchart LR
    Browser["ブラウザ\n(localhost:8888)"]
    Nginx["nginx:alpine\n(コンテナ)"]
    Volume["./src\n(ボリュームマウント)"]

    Browser -->|HTTP:8888| Nginx
    Volume -.->|読み取り専用| Nginx
```

## モジュールレベルのデータフロー

```mermaid
flowchart TB
    subgraph Browser["ブラウザ"]
        HTML["index.html"]
        CSS["style.css"]
        JS["game.js"]
        Canvas["Canvas API"]
        Storage["localStorage"]
    end

    HTML -->|読み込み| CSS
    HTML -->|読み込み| JS
    JS -->|描画| Canvas
    JS -->|ハイスコア保存/読込| Storage
```

## 状態遷移図

```mermaid
stateDiagram-v2
    [*] --> Ready: ページ読み込み
    Ready --> Playing: SPACE/タップ
    Playing --> GameOver: 壁衝突
    Playing --> GameOver: 自己衝突
    Playing --> Playing: エサ取得\n(スコア加算)
    GameOver --> Ready: SPACE/タップ
```

## ゲームロジック

### メインループ

1. 次の方向を現在の方向に適用
2. 新しい頭の位置を計算
3. 壁衝突 / 壁抜け判定
4. 自己衝突判定
5. スネーク移動（頭を追加）
6. エサ判定（取得なら伸びる、なければ尾を削除）
7. 描画

### レベルシステム

- 50点ごとにレベルアップ
- レベルアップで移動速度が10ms短縮
- 最低速度は50ms
