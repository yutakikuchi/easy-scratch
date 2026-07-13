# Design QA

## 対象

- 低学年・計算
- 低学年・プログラミング
- 高学年・計算
- 高学年・プログラミング
- 計算完了後の「考える時間」

## 比較した資料

参照モック:

- `docs/mockups/2026-07-13-calculation-programming-pages/lower-grade-calculation-v2.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/lower-grade-programming.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/upper-grade-calculation-v2.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/upper-grade-programming.png`

実装スクリーンショット:

- `docs/mockups/2026-07-13-calculation-programming-pages/implementation-lower-calculation.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/implementation-lower-programming.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/implementation-upper-calculation.png`
- `docs/mockups/2026-07-13-calculation-programming-pages/implementation-upper-programming.png`

並列比較:

- `docs/mockups/2026-07-13-calculation-programming-pages/design-comparison.html`

## 確認結果

- 2ページ構成、学年表示、青空系の背景、緑のスタート、青と紫の状態カードをモックに合わせた。
- 計算開始後、プログラムは0.1秒または0.2秒で全問正解し、人間の回答完了を待つ表示になる。
- 勝敗、順位、先着を示す表現は入れていない。
- 計算完了後は理由を選び、近くの人に説明してからまとめを開く。「考えを確かめる」前は次ページへ進めない。
- 低学年向けに表示する説明文と操作文には漢字を使っていない。
- 高学年はテンキー、くり返し、条件命令、実行中ブロックの強調を使える。
- 見本プログラムは宝を2個集めてゴールまで実行できた。
- 1487×1058で4画面を比較し、390×844では計算・プログラミングとも横方向のはみ出しがないことを確認した。
- ブラウザのコンソールエラーは0件だった。

## 意図した差分

- モックにない「考える時間」は追加要件として計算完了後に配置した。
- モックの固定画像ではなく操作可能な画面のため、計算結果、進捗、命令列、実行状態は状態に応じて更新する。
- プログラミング画面は小さい画面でも操作できるよう、デスクトップでは3列、狭い画面では1列に切り替える。

final result: passed
