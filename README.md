# summer-school

砧小学校サマースクール向けのプログラミング教材です。

紙の方眼ワークで手作業の大変さを体験してから、同じ作業を命令カード・くり返し・条件に置き換え、プログラミングで楽になることを体験する静的Webアプリです。

## カリキュラム

- [砧小学校サマースクール プログラミング講義カリキュラム案](docs/kinuta-programming-curriculum.md)

## 開発

```sh
npm test
npm run build
```

## Firebase Hosting

Firebase project: `summer-school-kinuta`

Firebase Analytics is initialized from `public/firebase-init.js`. The lesson app itself does not depend on Firebase SDK loading, so the game can still run if Analytics is blocked by a school network.

```sh
firebase deploy --only hosting --project summer-school-kinuta
```
