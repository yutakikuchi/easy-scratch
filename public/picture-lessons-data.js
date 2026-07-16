export const pictureLessons = {
  lower: [
    {
      id: "jump",
      title: "ジャンプぼうけん",
      shortTitle: "ジャンプで すすむ",
      description: "みぎへ すすんで、ジャンプして、2ひき ふもう",
      thumbnail: "./assets/picture-lessons/mock-lower-jump.png",
      stageType: "jump",
      stageTitle: "うごかしてみる",
      stageBackground: "./assets/picture-lessons/lower-jump-stage.png",
      sprite: "./assets/lower-mascot.png",
      repeatLabel: "3かい くりかえす",
      success: "できた！ 2ひき ふめた",
      sample: ["right", "jump", "stomp", "repeat"],
      actions: [
        { id: "right", label: "みぎへ すすむ", hint: "まえへ すすむ" },
        { id: "jump", label: "ジャンプ", hint: "みずを こえる" },
        { id: "stomp", label: "2かい ふむ", hint: "おなじ うごき" },
        { id: "repeat", label: "くりかえす", hint: "3かい つかう" }
      ]
    },
    {
      id: "fish",
      title: "おさかなダンス",
      shortTitle: "おさかなを およがす",
      description: "およぐ ルールを つくって、3かい つかおう",
      thumbnail: "./assets/picture-lessons/mock-lower-fish.png",
      stageType: "fish",
      stageTitle: "おさかなを およがそう",
      stageBackground: "./assets/picture-lessons/lower-fish-stage.png",
      sprite: "./assets/picture-lessons/lower-fish.png",
      repeatLabel: "3かい くりかえす",
      success: "3かい およげた！",
      sample: ["swim-right", "swim-up", "bubble", "repeat"],
      actions: [
        { id: "swim-right", label: "みぎへ およぐ", hint: "すいすい すすむ" },
        { id: "swim-up", label: "うえへ およぐ", hint: "なみを つくる" },
        { id: "bubble", label: "あわを だす", hint: "えに くわえる" },
        { id: "repeat", label: "くりかえす", hint: "3かい つかう" }
      ]
    },
    {
      id: "paint",
      title: "おえかきカー",
      shortTitle: "いろの せんを かく",
      description: "すすむ・まがるを 4かい つかって、しかくを かこう",
      thumbnail: "./assets/picture-lessons/mock-lower-paint.png",
      stageType: "paint",
      stageTitle: "おえかきカーを うごかそう",
      sprite: "./assets/picture-lessons/lower-paint-car.png",
      repeatLabel: "4かい くりかえす",
      success: "しかくが かけた！",
      sample: ["forward", "turn", "color", "repeat"],
      actions: [
        { id: "forward", label: "まえへ すすむ", hint: "せんを かく" },
        { id: "turn", label: "みぎを むく", hint: "かどを つくる" },
        { id: "color", label: "いろを かえる", hint: "4しょく つかう" },
        { id: "repeat", label: "くりかえす", hint: "4かい つかう" }
      ]
    }
  ],
  upper: [
    {
      id: "motion",
      title: "モーションキャンバス",
      shortTitle: "道にそって動かす",
      description: "距離と角度のルールを、3回くり返して動かそう",
      thumbnail: "./assets/picture-lessons/mock-upper-motion.png",
      stageType: "motion",
      stageTitle: "動きの道をつくる",
      stageBackground: "./assets/picture-lessons/upper-park-stage.png",
      sprite: "./assets/robot-mascot.png",
      repeatLabel: "3回くり返す",
      success: "同じルールで 3回動いた！",
      sample: ["right-100", "up-50", "turn-30", "repeat"],
      actions: [
        { id: "right-100", label: "右へ 100", hint: "x方向に動く" },
        { id: "up-50", label: "上へ 50", hint: "y方向に動く" },
        { id: "turn-30", label: "30° 回す", hint: "向きを変える" },
        { id: "repeat", label: "3回くり返す", hint: "同じルールを使う" }
      ]
    },
    {
      id: "story",
      title: "アニメーション絵本",
      shortTitle: "3コマのアニメを作る",
      description: "1つの動きのルールを、3コマすべてに使おう",
      thumbnail: "./assets/picture-lessons/mock-upper-story.png",
      stageType: "story",
      stageTitle: "3コマに使う",
      stageBackground: "./assets/picture-lessons/upper-park-stage.png",
      sprite: "./assets/robot-mascot.png",
      repeatLabel: "3回くり返す",
      success: "1つのルールで アニメになった！",
      sample: ["right-80", "up-60", "down-60", "repeat"],
      actions: [
        { id: "right-80", label: "右へ 80", hint: "次のコマへ" },
        { id: "up-60", label: "上へ 60", hint: "ジャンプの上" },
        { id: "down-60", label: "下へ 60", hint: "着地する" },
        { id: "repeat", label: "3回くり返す", hint: "3コマに使う" }
      ]
    },
    {
      id: "coordinate",
      title: "座標アートラボ",
      shortTitle: "動いて形を描く",
      description: "x・y・角度のルールを6回使って、形を描こう",
      thumbnail: "./assets/picture-lessons/mock-upper-coordinate.png",
      stageType: "coordinate",
      stageTitle: "くりかえして 形をつくる",
      sprite: "./assets/robot-mascot.png",
      repeatLabel: "6回くり返す",
      success: "ルールを6回使って 絵ができた！",
      sample: ["x-100", "y-50", "turn-60", "repeat"],
      actions: [
        { id: "x-100", label: "xを +100", hint: "横へ動く" },
        { id: "y-50", label: "yを +50", hint: "縦へ動く" },
        { id: "turn-60", label: "60° 回す", hint: "次の向きへ" },
        { id: "repeat", label: "6回くり返す", hint: "同じ形を作る" }
      ]
    }
  ]
};

export function findPictureLesson(grade, lessonId) {
  return pictureLessons[grade]?.find((lesson) => lesson.id === lessonId) ?? null;
}
