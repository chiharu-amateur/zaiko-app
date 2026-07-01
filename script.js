const questions = [
  {
    category: "割錠",
    text: "処方医の指示により、規格のない用量にするため錠剤を半錠に分割した。自家製剤加算は算定できる？",
    answer: true,
    explanation: "医師の指示に基づき、既製品では対応しにくい用量調整として割錠した場合は、算定対象になり得ます。"
  },
  {
    category: "割錠",
    text: "患者が飲みやすいように、薬剤師判断のみで錠剤を半錠にした。自家製剤加算は算定できる？",
    answer: false,
    explanation: "自家製剤加算は原則として処方医の指示が必要です。薬剤師判断のみの加工では算定できません。"
  },
  {
    category: "粉砕",
    text: "嚥下困難のため、医師の指示で錠剤を粉砕した。ただし同一成分・同一用量で散剤が薬価収載されている。算定できる？",
    answer: false,
    explanation: "同一成分・同一規格などで対応可能な剤形が薬価収載されている場合は、自家製剤加算の対象外になりやすい代表例です。"
  },
  {
    category: "粉砕",
    text: "医師の指示でカプセルを脱カプセルし、粉末として分包した。既製の散剤がない。算定できる？",
    answer: true,
    explanation: "医師の指示があり、既製剤で対応できない剤形変更として脱カプセル・分包した場合は算定対象になり得ます。"
  },
  {
    category: "一包化との違い",
    text: "複数の錠剤を飲み忘れ防止のために一包化しただけ。自家製剤加算は算定できる？",
    answer: false,
    explanation: "一包化は自家製剤加算ではありません。要件を満たす場合は一包化加算など別の評価になります。"
  },
  {
    category: "軟膏混合",
    text: "2種類の軟膏を混合した。これは自家製剤加算として算定する？",
    answer: false,
    explanation: "軟膏などの混合は、内容によっては計量混合調剤加算の検討になります。自家製剤加算とは区別します。"
  },
  {
    category: "液剤",
    text: "錠剤を粉砕して水に溶かし、服用しやすい液状に調製した。医師の明確な指示がない。算定できる？",
    answer: false,
    explanation: "剤形変更であっても、医師の指示が確認できない場合は自家製剤加算の算定は避けるべきです。"
  },
  {
    category: "点眼",
    text: "点眼薬を2本まとめて交付し、患者に使用方法を説明した。自家製剤加算は算定できる？",
    answer: false,
    explanation: "単なる交付・説明は製剤加工ではないため、自家製剤加算の対象ではありません。"
  },
  {
    category: "規格違い",
    text: "10mg錠を半錠にして5mgとして調剤したが、同一成分の5mg錠が薬価収載されている。算定できる？",
    answer: false,
    explanation: "既製の5mg錠で対応できる場合、あえて割錠しても自家製剤加算は算定できないケースです。"
  },
  {
    category: "返戻注意",
    text: "処方せんに『粉砕』の指示があり、既製の同一成分散剤がなく、粉砕して分包した。算定できる？",
    answer: true,
    explanation: "医師の指示があり、既製剤で対応できない加工であれば算定対象になり得ます。ただし薬価収載状況の確認は必須です。"
  }
];

// ここにApps Scriptの「ウェブアプリURL」を貼り付けてください。
// 例: const SUBMIT_URL = "https://script.google.com/macros/s/xxxxx/exec";
const SUBMIT_URL = "ここにGoogle Apps ScriptのウェブアプリURLを貼る";
const STORAGE_KEY = "jikaseizai_quiz_results_backup";

let current = 0;
let score = 0;
let answered = false;
let userName = "";
let startedAt = "";
let answersLog = [];

const $ = (id) => document.getElementById(id);
const startScreen = $("startScreen");
const quizScreen = $("quizScreen");
const finishScreen = $("finishScreen");
const buttons = document.querySelectorAll(".choice");

$("startBtn").addEventListener("click", startQuiz);
$("downloadCsvBtn").addEventListener("click", downloadCsv);
$("clearDataBtn").addEventListener("click", clearSavedData);
document.querySelectorAll(".difficulty").forEach(btn => btn.addEventListener("click", () => saveSurvey(btn.dataset.difficulty)));
$("retryBtn").addEventListener("click", startQuiz);
$("nextBtn").addEventListener("click", nextQuestion);
buttons.forEach(btn => btn.addEventListener("click", () => checkAnswer(btn)));

function startQuiz() {
  const inputName = $("userName").value.trim();
  if (!inputName) {
    $("nameError").classList.remove("hidden");
    $("userName").focus();
    return;
  }
  $("nameError").classList.add("hidden");
  userName = inputName;
  startedAt = new Date().toISOString();
  answersLog = [];
  current = 0;
  score = 0;
  startScreen.classList.add("hidden");
  finishScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  answered = false;
  const q = questions[current];
  $("progress").textContent = `${current + 1} / ${questions.length}`;
  $("score").textContent = `正解 ${score}`;
  $("meterFill").style.width = `${(current / questions.length) * 100}%`;
  $("category").textContent = q.category;
  $("question").textContent = q.text;
  $("resultBox").classList.add("hidden");
  buttons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });
}

function checkAnswer(btn) {
  if (answered) return;
  answered = true;
  const q = questions[current];
  const selected = btn.dataset.answer === "true";
  const isCorrect = selected === q.answer;
  if (isCorrect) score++;
  answersLog.push({
    no: current + 1,
    category: q.category,
    question: q.text,
    selected: selected ? "算定できる" : "算定できない",
    correctAnswer: q.answer ? "算定できる" : "算定できない",
    isCorrect: isCorrect ? "正解" : "不正解"
  });

  buttons.forEach(b => {
    b.disabled = true;
    const val = b.dataset.answer === "true";
    if (val === q.answer) b.classList.add("correct");
  });
  if (!isCorrect) btn.classList.add("wrong");

  $("score").textContent = `正解 ${score}`;
  $("resultTitle").textContent = isCorrect ? "正解！" : "不正解";
  $("explanation").textContent = q.explanation;
  $("resultBox").classList.remove("hidden");
  $("meterFill").style.width = `${((current + 1) / questions.length) * 100}%`;
  $("nextBtn").textContent = current === questions.length - 1 ? "結果を見る" : "次の問題へ";
}

function nextQuestion() {
  current++;
  if (current >= questions.length) finishQuiz();
  else showQuestion();
}

function finishQuiz() {
  document.querySelectorAll(".difficulty").forEach(btn => btn.classList.remove("selected"));
  $("savedMessage").classList.add("hidden");
  $("surveyBox").classList.remove("hidden");
  quizScreen.classList.add("hidden");
  finishScreen.classList.remove("hidden");
  const percent = Math.round((score / questions.length) * 100);
  $("finalScore").textContent = `${score} / ${questions.length}問 正解`;
  $("finalMessage").textContent = percent >= 80
    ? "かなり良い感じです！返戻されやすいポイントも復習しておきましょう。"
    : percent >= 50
      ? "あと少し！医師の指示・既製剤の有無・一包化/計量混合との違いを重点的に確認しましょう。"
      : "基本ルールからもう一度確認すると伸びます。まずは“医師の指示”と“既製剤の有無”を押さえましょう。";
}

async function saveSurvey(difficulty) {
  document.querySelectorAll(".difficulty").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.difficulty === difficulty);
  });

  const record = {
    submittedAt: new Date().toISOString(),
    startedAt,
    name: userName,
    score,
    total: questions.length,
    percent: Math.round((score / questions.length) * 100),
    difficulty,
    answers: answersLog
  };

  saveLocalBackup(record);
  $("savedMessage").textContent = "送信中です…";
  $("savedMessage").classList.remove("hidden");

  if (!SUBMIT_URL || SUBMIT_URL.includes("ここに")) {
    $("savedMessage").textContent = "ウェブアプリURLが未設定です。端末内バックアップのみ保存しました。";
    return;
  }

  try {
    await fetch(SUBMIT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(record)
    });
    $("savedMessage").textContent = "回答をGoogleスプレッドシートへ送信しました。";
    $("surveyBox").classList.add("hidden");
  } catch (error) {
    console.error(error);
    $("savedMessage").textContent = "送信に失敗しました。端末内バックアップは保存されています。";
  }
}

function saveLocalBackup(record) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  saved.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function downloadCsv() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (saved.length === 0) {
    alert("保存されているバックアップデータがありません。");
    return;
  }
  const rows = [["送信日時", "開始日時", "名前", "正解数", "総問題数", "正答率", "難易度", "回答詳細"]];
  saved.forEach(r => rows.push([
    r.submittedAt,
    r.startedAt,
    r.name,
    r.score,
    r.total,
    r.percent + "%",
    r.difficulty,
    JSON.stringify(r.answers || [])
  ]));
  const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "自家製剤加算クイズ_端末内バックアップ.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function clearSavedData() {
  if (confirm("この端末に保存されたバックアップデータを削除しますか？")) {
    localStorage.removeItem(STORAGE_KEY);
    alert("バックアップデータを削除しました。");
  }
}
