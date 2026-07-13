export const calculationLessons = {
  lower: {
    questions: [
      { formula: "1+1+1+1+1+1+1", answer: 7, choices: [6, 7, 8] },
      { formula: "2+2+2+2", answer: 8, choices: [6, 8, 10] },
      { formula: "3+1+3+1", answer: 8, choices: [6, 7, 8] }
    ],
    copy: {
      eyebrow: "おなじ けいさんを やってみよう",
      title: "プログラムは どうやって けいさんするの？",
      lead: "スタートを おすと、いっしょに はじまるよ",
      questionHeading: "こたえを えらぼう",
      startHint: "おすと いっしょに はじまる",
      humanTitle: "にんげん",
      programTitle: "プログラム",
      waiting: "スタートを まっているよ",
      humanRunning: "けいさんちゅう",
      humanComplete: "ぜんぶ こたえたよ！",
      programComplete: "けいさん できた！",
      programWaiting: "みんなが おわるのを まっているよ",
      programTogether: "みんなの けいさんも おわった！",
      reflectionTitle: "どうして すぐに せいかくに できたのかな？",
      reflectionLead: "となりの ひとと はなして、あてはまる ことばを おそう",
      reflectionChoices: ["おなじ じゅんばん", "まちがえずに", "なんどでも"],
      reveal: "わかったことを みる",
      insightTitle: "プログラムは、すぐに せいかくに けいさんできる！",
      insightBody: "きめた やりかたを、まちがえずに なんどでも できるから",
      next: "つぎは えを うごかそう"
    }
  },
  upper: {
    questions: [
      { formula: "12+8+12+8+12+8", answer: 60 },
      { formula: "25+25+25+25", answer: 100 },
      { formula: "7+3+7+3+7+3", answer: 30 },
      { formula: "14+6+14+6+14+6", answer: 60 },
      { formula: "30+20+30+20", answer: 100 }
    ],
    copy: {
      eyebrow: "同じ計算式で、速さと正確さを確かめよう",
      title: "人間とプログラムで、同じ計算に挑戦",
      lead: "スタートを押すと、同時に始まります",
      questionHeading: "答えを入力しよう",
      startHint: "押すと同時に始まります",
      humanTitle: "人間",
      programTitle: "プログラム",
      waiting: "スタートを待っています",
      humanRunning: "回答中",
      humanComplete: "回答完了",
      programComplete: "計算完了",
      programWaiting: "人間の回答完了を待っています",
      programTogether: "人間の回答も完了しました",
      reflectionTitle: "なぜ、すぐ正確に計算できたのだろう？",
      reflectionLead: "自分の予想を選び、近くの人に理由を説明しよう",
      reflectionChoices: ["決めた手順を守る", "同じ処理を高速に繰り返す", "疲れても精度が変わらない"],
      reveal: "考えを確かめる",
      insightTitle: "プログラムは、すぐに正確に計算できた",
      insightBody: "決めた手順を、間違えず・飛ばさず・同じように繰り返せるから",
      next: "次はプログラミングへ"
    }
  }
};

export function calculateCorrectCount(questions, answers) {
  return questions.reduce((count, question, index) => (
    Number(answers[index]) === question.answer ? count + 1 : count
  ), 0);
}

export function answeredCount(answers) {
  return answers.filter((answer) => answer !== null && answer !== "").length;
}

export function isCalculationComplete(questions, answers) {
  return answeredCount(answers) === questions.length;
}

export function containsKanji(value) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}
