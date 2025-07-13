document.addEventListener('DOMContentLoaded', () => {
    let questions = []; // クイズ問題データを格納する配列
    let currentQuestionIndex = 0; // 現在の問題のインデックス
    let score = 0; // スコア

    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    const startButton = document.getElementById('start-button');
    const questionText = document.getElementById('question-text');
    const trueButton = document.getElementById('true-button');
    const falseButton = document.getElementById('false-button');
    const feedbackText = document.getElementById('feedback-text');
    const nextButton = document.getElementById('next-button');

    const scoreDisplay = document.getElementById('score-display');
    const restartButton = document.getElementById('restart-button');

    // 初期表示：スタート画面
    startScreen.classList.remove('hidden');
    quizScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    // APIからクイズデータを読み込む関数
    async function loadQuestions() {
        try {
            // APIのエンドポイントは相対パスで指定 (Render上で正しく動作するため)
            const response = await fetch('/api/questions'); 
            
            // HTTPエラー（例: 404 Not Found, 500 Internal Server Error）をチェック
            if (!response.ok) {
                // サーバーからのレスポンスがOKでなければエラーを投げる
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json(); // レスポンスをJSONとしてパース

            // データが'success'メッセージと'data'配列を含んでいるか確認
            if (data.message === 'success' && Array.isArray(data.data)) {
                questions = data.data; // 取得した問題データを格納
                console.log('クイズデータを正常に読み込みました:', questions); // デバッグ用ログ
            } else {
                // APIからのレスポンス形式が期待と異なる場合
                throw new Error('API response format is incorrect or data is empty.');
            }

        } catch (error) {
            console.error('クイズデータの読み込みエラー:', error);
            // ユーザーにエラーメッセージを表示
            document.getElementById('question-container').innerHTML = '<p>クイズデータの読み込みに失敗しました。サーバーが起動しているか確認してください。</p>';
            // 致命的なエラーのため、スタートボタンを無効化
            startButton.disabled = true;
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
        displayQuestion();
    }

    // 問題を表示する関数
    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionText.textContent = question.question;
            feedbackText.textContent = ''; // フィードバックをクリア
            nextButton.classList.add('hidden'); // 次へボタンを非表示
            trueButton.disabled = false; // 回答ボタンを有効化
            falseButton.disabled = false;
        } else {
            showResult(); // 全問終了したら結果表示
        }
    }

    // 回答をチェックする関数
    function checkAnswer(userAnswer) {
        const correctAnswer = questions[currentQuestionIndex].answer;
        if (userAnswer === correctAnswer) {
            feedbackText.textContent = '正解！';
            feedbackText.style.color = 'green';
            score++;
        } else {
            feedbackText.textContent = `不正解！ 正しい答えは「${correctAnswer ? 'はい' : 'いいえ'}」です。`;
            feedbackText.style.color = 'red';
        }
        trueButton.disabled = true; // 回答ボタンを無効化
        falseButton.disabled = true;
        nextButton.classList.remove('hidden'); // 次へボタンを表示
    }

    // 結果を表示する関数
    function showResult() {
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        scoreDisplay.textContent = `${score} / ${questions.length}`;
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

    // ページ読み込み時にクイズデータをロード
    loadQuestions();
});