document.addEventListener('DOMContentLoaded', () => {
    let questions = []; // クイズ問題データを格納する配列
    let currentQuestionIndex = 0; // 現在の問題のインデックス
    let score = 0; // スコア

    // HTML要素の取得
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    const startButton = document.getElementById('start-button');
    const questionText = document.getElementById('question-text');
    const trueButton = document.getElementById('true-button');
    const falseButton = document.getElementById('false-button');
    const feedbackText = document.getElementById('feedback-text');
    const explanationText = document.getElementById('explanation-text'); // 解説文表示用要素
    const nextButton = document.getElementById('next-button');

    const scoreDisplay = document.getElementById('score-display');
    const totalQuestionsDisplay = document.getElementById('total-questions-display'); // 追加
    const restartButton = document.getElementById('restart-button');
    const backToStartButton = document.getElementById('back-to-start-button'); // 追加

    // 初期表示：スタート画面のみ表示
    startScreen.classList.remove('hidden');
    quizScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    // APIからクイズデータを読み込む関数
    async function loadQuestions() {
        try {
            const response = await fetch('/api/questions'); 
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.message === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                questions = data.data; 
                console.log('クイズデータを正常に読み込みました:', questions);
                totalQuestionsDisplay.textContent = questions.length; // 全問題数を表示
            } else {
                throw new Error('API response format is incorrect or data is empty.');
            }

        } catch (error) {
            console.error('クイズデータの読み込みエラー:', error);
            if(questionText) { 
                questionText.textContent = 'クイズデータの読み込みに失敗しました。サーバーが起動しているか確認してください。';
                questionText.style.color = 'red'; // エラーメッセージを赤く表示
            } else {
                alert('クイズデータの読み込みに失敗しました。');
            }
            if(startButton) {
                startButton.disabled = true;
            }
        }
    }

    // クイズを開始する関数
    function startQuiz() {
        if (questions.length === 0) {
            alert('問題が読み込まれていません。ページをリロードするか、後でもう一度お試しください。');
            return;
        }
        currentQuestionIndex = 0;
        score = 0;

        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');

        displayQuestion();
    }

    // 問題を表示する関数
    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionText.textContent = question.question;
            feedbackText.textContent = '';
            feedbackText.style.color = '';
            explanationText.textContent = ''; // 解説文をクリア
            explanationText.classList.add('hidden'); // 解説文を非表示
            nextButton.classList.add('hidden');
            trueButton.disabled = false;
            falseButton.disabled = false;
        } else {
            showResult();
        }
    }

    // 回答をチェックする関数
    function checkAnswer(userAnswer) {
        const currentQuestion = questions[currentQuestionIndex];
        const correctAnswer = currentQuestion.answer; 

        // デバッグ用ログ (必要なければ後で削除)
        console.log('ユーザーの回答 (userAnswer):', userAnswer, typeof userAnswer);
        console.log('正しい答え (correctAnswer):', correctAnswer, typeof correctAnswer);

        if (userAnswer === correctAnswer) {
            feedbackText.textContent = '正解！';
            feedbackText.style.color = 'green';
            score++;
        } else {
            const correctText = correctAnswer ? '〇' : '✕'; // 〇✕で表示
            feedbackText.textContent = `不正解！ 正しい答えは「${correctText}」です。`;
            feedbackText.style.color = 'red';
        }
        
        // 解説文の表示
        if (currentQuestion.explanation) {
            explanationText.textContent = `【解説】${currentQuestion.explanation}`;
            explanationText.classList.remove('hidden');
        } else {
            explanationText.textContent = '';
            explanationText.classList.add('hidden');
        }

        trueButton.disabled = true;
        falseButton.disabled = true;
        nextButton.classList.remove('hidden'); // 次へボタンを表示
    }

    // 結果画面を表示する関数
    function showResult() {
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        scoreDisplay.textContent = score; // スコアのみ表示
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startQuiz);
    trueButton.addEventListener('click', () => checkAnswer(true));
    falseButton.addEventListener('click', () => checkAnswer(false));
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion();
    });
    restartButton.addEventListener('click', startQuiz);
    // 「最初の画面に戻る」ボタンのイベントリスナー
    backToStartButton.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        // 必要に応じて、問題数を再ロードするloadQuestions()を呼ぶことも可能だが、
        // 今回はそのままにしておく (すでにロード済みのため)
    });


    // ページ読み込み時にクイズデータをロード
    loadQuestions();
});