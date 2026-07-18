export const pictureLessons = {
  lower: [
    {
      id: "grid-paint",
      title: "ほうがんし いろぬり",
      shortTitle: "しょうがいぶつを よけて ぬる",
      description: "1マスずつ うごき、しょうがいぶつを よけて 3つのマスを ぬろう",
      thumbnail: "./assets/picture-lessons/mock-lower-grid-paint-v2.svg",
      stageType: "grid-paint",
      stageTitle: "ほうがんしを うごかそう",
      sprite: "./assets/lower-mascot.png",
      repeatLabel: "みぎへ すすみ、うえへ まわって、しょうがいぶつを よけよう",
      success: "できた！ よけながら 3つの マスを ぬれた！",
      sample: ["cell-right", "cell-right", "paint-cell", "cell-up", "cell-up", "paint-cell", "cell-right", "cell-right", "cell-right", "paint-cell"],
      actions: [
        { id: "cell-right", label: "みぎへ 1マス", hint: "となりへ うごく" },
        { id: "cell-up", label: "うえへ 1マス", hint: "うえへ うごく" },
        { id: "paint-cell", label: "いろを ぬる", hint: "いまの マスを ぬる" }
      ]
    },
    {
      id: "jump",
      title: "ジャンプぼうけん",
      shortTitle: "ジャンプで すすむ",
      description: "みぎへ すすんで、ジャンプして、「1かい ふむ」を 2かい つかおう",
      thumbnail: "./assets/picture-lessons/mock-lower-jump.png",
      stageType: "jump",
      stageTitle: "うごかしてみる",
      stageBackground: "./assets/picture-lessons/lower-jump-stage.png",
      sprite: "./assets/lower-mascot.png",
      repeatLabel: "「1かい ふむ」を 2まい、または 1まいを ×2にして ゴールする",
      success: "できた！ 2ひき ふめた",
      sample: ["right", "jump", "stomp", "stomp", "right"],
      builderSample: ["right", "jump", "stomp::repeat-2", "right"],
      actions: [
        { id: "right", label: "みぎへ すすむ", hint: "まえへ すすむ" },
        { id: "jump", label: "ジャンプ", hint: "みずを こえる" },
        { id: "stomp", label: "1かい ふむ", hint: "この めいれいだけ ×2にも できる", repeatable: true }
      ]
    },
    {
      id: "fish",
      title: "おさかなダンス",
      shortTitle: "おさかなを およがす",
      description: "4つの うごきを 2かい くりかえして、ゴールへ およごう",
      thumbnail: "./assets/picture-lessons/mock-lower-fish.png",
      stageType: "fish",
      stageTitle: "おさかなを およがそう",
      stageBackground: "./assets/picture-lessons/lower-fish-stage.png",
      sprite: "./assets/picture-lessons/lower-fish.png",
      repeatLabel: "4つのルールを 2かい つかって ゴールする",
      success: "できた！ 2かい くりかえして ゴール！",
      repeatRuleTimes: 2,
      sample: ["swim-up-right", "bubble", "swim-down-right", "swim-right", "swim-up-right", "bubble", "swim-down-right", "swim-right"],
      actions: [
        { id: "swim-up-right", label: "みぎうえへ およぐ", hint: "かいへ ちかづく" },
        { id: "bubble", label: "あわを だす", hint: "そのばで かいを ひらく" },
        { id: "swim-down-right", label: "みぎしたへ およぐ", hint: "ゴールへ おりる" },
        { id: "swim-right", label: "みぎへ およぐ", hint: "さいごは まっすぐ" }
      ]
    },
    {
      id: "paint",
      title: "おえかきカー",
      shortTitle: "いろの せんを かく",
      description: "「すすむ → みぎを むく」を 4かい。さいごにも みぎを むこう！",
      thumbnail: "./assets/picture-lessons/mock-lower-paint.png",
      stageType: "paint",
      stageTitle: "おえかきカーを うごかそう",
      sprite: "./assets/picture-lessons/lower-paint-car.png",
      repeatLabel: "「まえへ すすむ → みぎを むく」を ×4にして、はじめの むきに もどる",
      success: "しかくが かけて、はじめの むきに もどった！",
      repeatRuleTimes: 4,
      sample: ["forward", "turn", "forward", "turn", "forward", "turn", "forward", "turn"],
      builderSample: ["forward", "turn"],
      actions: [
        { id: "forward", label: "まえへ すすむ", hint: "せんを かく" },
        { id: "backward", label: "うしろへ もどる", hint: "ぎゃくに すすむ" },
        { id: "turn", label: "みぎを むく", hint: "かどを つくる" },
        { id: "turn-left", label: "ひだりを むく", hint: "ぎゃくの かど" }
      ]
    }
  ],
  upper: [
    {
      id: "rescue",
      title: "座標レスキュー",
      shortTitle: "座標のルールをくりかえす",
      description: "4つの移動ルールを2回くりかえし、1・2・3の番号を順番に取ろう",
      thumbnail: "./assets/picture-lessons/mock-upper-rescue.png",
      stageType: "upper-rescue",
      sprite: "./assets/robot-mascot.png"
    },
    {
      id: "keyframe",
      title: "ロボット・フリーキック",
      shortTitle: "x・yの力で軌道を再現する",
      description: "蹴る力を変え、壁をこえてゴールへ落ちる軌道を作ろう",
      thumbnail: "./assets/picture-lessons/mock-upper-free-kick-v3.png",
      stageType: "upper-keyframe",
      sprite: "./assets/robot-mascot.png"
    },
    {
      id: "pattern",
      title: "パターンアートラボ",
      shortTitle: "二重ループで六角形の花をかく",
      description: "x・θで六角形を作り、nで同じ六角形をかく回数を変えよう",
      thumbnail: "./assets/picture-lessons/mock-upper-pattern.png",
      stageType: "upper-pattern",
      sprite: "./assets/robot-mascot.png"
    },
    {
      id: "grid-lab",
      title: "座標いろぬりラボ",
      shortTitle: "6枚のルールで8マスをぬる",
      description: "x・y・nと6枚のルールを組み合わせ、ジグザグに進んで8マスを2色でぬろう",
      thumbnail: "./assets/picture-lessons/mock-upper-grid-paint-v2.svg",
      stageType: "upper-grid-paint",
      sprite: "./assets/robot-mascot.png"
    }
  ]
};

export function findPictureLesson(grade, lessonId) {
  return pictureLessons[grade]?.find((lesson) => lesson.id === lessonId) ?? null;
}
