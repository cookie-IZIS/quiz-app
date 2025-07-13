// アプリの各画面の要素（部品）を取得
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const explanationScreen = document.getElementById('explanation-screen');
const resultScreen = document.getElementById('result-screen');

// 各ボタンの要素（部品）を取得
const startButton = document.getElementById('start-button');
const answerMaruButton = document.getElementById('answer-maru-button');
const answerBatsuButton = document.getElementById('answer-batsu-button');
const nextQuestionButton = document.getElementById('next-question-button');
const backToStartFromQuizButton = document.getElementById('back-to-start-from-quiz');
const backToStartFromExplanationButton = document.getElementById('back-to-start-from-explanation');
const backToStartFromResultButton = document.getElementById('back-to-start-from-result');

// 問題文や解説などを表示する要素を取得
const questionText = document.getElementById('question-text');
const resultText = document.getElementById('result-text');
const explanationText = document.getElementById('explanation-text');
const scoreText = document.getElementById('score-text');

// クイズデータと現在の状態を管理する変数
let questions = []; // 全クイズ問題が格納される配列
let currentQuestionIndex = 0; // 現在表示している問題の番号
let correctCount = 0; // 正解数

// --- 画面を切り替える関数 ---
// activeなクラスを付け替えることで、CSSで設定した表示/非表示を切り替えます
function showScreen(screenToShow) {
    const screens = [startScreen, quizScreen, explanationScreen, resultScreen];
    screens.forEach(screen => {
        screen.classList.remove('active'); // 全ての画面からactiveクラスを削除
    });
    screenToShow.classList.add('active'); // 指定された画面にactiveクラスを追加
}

// --- クイズデータを読み込む関数 ---
async function loadQuestions() {
    try {
        // バックエンド（お店の裏口）から問題データを取得しに行く
        const response = await fetch('http://localhost:3000/api/questions');
        const data = await response.json();
        questions = data.data; // 取得した問題データをquestions変数に格納

        // 問題がシャッフルされるようにする（毎回違う順番で出題されるように）
        questions.sort(() => Math.random() - 0.5); 

        console.log('クイズデータを読み込みました:', questions);
    } catch (error) {
        console.error('クイズデータの読み込みに失敗しました:', error);
        alert('クイズデータの読み込みに失敗しました。サーバーが起動しているか確認してください。');
    }
}

// --- クイズを開始する関数 ---
function startQuiz() {
    currentQuestionIndex = 0; // 最初の問題から始める
    correctCount = 0; // 正解数をリセット
    loadQuestions().then(() => { // まずクイズデータを読み込んでから...
        if (questions.length > 0) { // 問題がちゃんと読み込めていれば
            displayQuestion(); // 最初の問題を表示
            showScreen(quizScreen); // 設問画面に切り替える
        }
    });
}

// --- 問題を表示する関数 ---
function displayQuestion() {
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        questionText.textContent = question.question; // 問題文を画面に表示
    } else {
        // 全ての問題を解き終えたら結果画面へ
        showResult();
    }
}

// --- 正誤判定を行う関数 ---
function checkAnswer(userAnswer) {
    const currentQuestion = questions[currentQuestionIndex];
    // ユーザーの答え(true/false)と、データベースの答え(1/0)を比較
    // データベースの1をtrue、0をfalseとして扱うように修正
    let isCorrect = (userAnswer === (currentQuestion.answer === 1));

    if (isCorrect) {
        correctCount++; // 正解なら正解数を増やす
        resultText.textContent = '正解！';
        resultText.style.color = '#28a745'; // 緑色
    } else {
        resultText.textContent = '不正解！';
        resultText.style.color = '#dc3545'; // 赤色
    }
    explanationText.textContent = currentQuestion.explanation; // 解説を表示
    showScreen(explanationScreen); // 解説画面に切り替える
}

// --- 次の設問へ進む関数 ---
function goToNextQuestion() {
    currentQuestionIndex++; // 次の問題の番号へ
    displayQuestion(); // 次の問題を表示
    if (currentQuestionIndex < questions.length) { // まだ問題があれば
        showScreen(quizScreen); // 設問画面へ戻る
    }
    // 全ての問題が終わっていたらdisplayQuestion()内でshowResult()が呼ばれる
}

// --- 結果画面を表示する関数 ---
function showResult() {
    scoreText.textContent = `${questions.length}問中、${correctCount}問正解しました！`;
    showScreen(resultScreen); // 結果画面に切り替える
}

// --- 初期画面に戻る関数（共通） ---
function resetApp() {
    currentQuestionIndex = 0;
    correctCount = 0;
    questions = []; // 問題データもリセット
    showScreen(startScreen); // 初期画面に戻る
    console.log('アプリがリセットされました。');
}

// --- イベントリスナー（ボタンが押されたときの反応を設定） ---

// 「クイズ開始」ボタンが押されたらクイズを開始
startButton.addEventListener('click', startQuiz);

// 「○」ボタンが押されたら、答えをTRUEとして正誤判定
answerMaruButton.addEventListener('click', () => checkAnswer(true));

// 「×」ボタンが押されたら、答えをFALSEとして正誤判定
answerBatsuButton.addEventListener('click', () => checkAnswer(false));

// 「次の設問へ」ボタンが押されたら次の問題へ
nextQuestionButton.addEventListener('click', goToNextQuestion);

// 「設問画面から初期画面に戻る」ボタン
backToStartFromQuizButton.addEventListener('click', resetApp);

// 「解説画面から初期画面に戻る」ボタン
backToStartFromExplanationButton.addEventListener('click', resetApp);

// 「結果画面から初期画面に戻る」ボタン
backToStartFromResultButton.addEventListener('click', resetApp);

// アプリ起動時に初期画面を表示する
showScreen(startScreen);