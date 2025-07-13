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
    const nextButton = document.getElementById('next-button');

    const scoreDisplay = document.getElementById('score-display');
    const restartButton = document.getElementById('restart-button');

    // 初期表示：スタート画面のみ表示
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json(); // レスポンスをJSONとしてパース

            // データが'success'メッセージと'data'配列を含んでいるか確認
            if (data.message === 'success' && Array.isArray(data.data)) {
                questions = data.data; // 取得した問題データを格納
                console.log('クイズデータを正常に読み込みました:', questions); // デバッグ用ログ
            } else {
                throw new Error('API response format is incorrect or data is empty.');
            }

        } catch (error) {
            console.error('クイズデータの読み込みエラー:', error);
            // ユーザーにエラーメッセージを表示
            // question-text要素が存在することを確認してからinnerHTMLを設定
            if(questionText) { // nullチェックを追加
                questionText.textContent = 'クイズデータの読み込みに失敗しました。サーバーが起動しているか確認してください。';
            } else {
                // エラー表示用の要素がなければ、単純にアラート
                alert('クイズデータの読み込みに失敗しました。');
            }
            if(startButton) { // nullチェックを追加
                startButton.disabled = true; // 致命的なエラーのため、スタートボタンを無効化
            }
        }
    }

    // クイズを開始する関数
    function startQuiz() {
        // 問題が読み込まれていない場合はアラートを出し、処理を中断
        if (questions.length === 0) {
            alert('問題が読み込まれていません。ページをリロードするか、後でもう一度お試しください。');
            return;
        }
        currentQuestionIndex = 0; // 現在の問題インデックスをリセット
        score = 0; // スコアをリセット

        // 画面の切り替え
        startScreen.classList.add('hidden'); // スタート画面を非表示
        quizScreen.classList.remove('hidden'); // クイズ画面を表示
        resultScreen.classList.add('hidden'); // 結果画面を非表示

        displayQuestion(); // 最初の問題を表示
    }

    // 問題を表示する関数
    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionText.textContent = question.question; // 問題文を設定
            feedbackText.textContent = ''; // フィードバックテキストをクリア
            feedbackText.style.color = ''; // フィードバックテキストの色をリセット
            nextButton.classList.add('hidden'); // 「次へ」ボタンを非表示
            trueButton.disabled = false; // 回答ボタンを有効化
            falseButton.disabled = false;
        } else {
            showResult(); // 全問終了したら結果表示
        }
    }

    // 回答をチェックする関数
    function checkAnswer(userAnswer) {
        const currentQuestion = questions[currentQuestionIndex];
        // PostgreSQLのBOOLEAN型はJavaScriptではtrue/falseになる
        const correctAnswer = currentQuestion.answer; 

        if (userAnswer === correctAnswer) {
            feedbackText.textContent = '正解！';
            feedbackText.style.color = 'green';
            score++;
        } else {
            // 正しい答えを日本語で表示
            const correctText = correctAnswer ? 'はい' : 'いいえ';
            feedbackText.textContent = `不正解！ 正しい答えは「${correctText}」です。`;
            feedbackText.style.color = 'red';
        }
        trueButton.disabled = true; // 回答ボタンを無効化
        falseButton.disabled = true;
        nextButton.classList.remove('hidden'); // 「次へ」ボタンを表示
    }

    // 結果画面を表示する関数
    function showResult() {
        quizScreen.classList.add('hidden'); // クイズ画面を非表示
        resultScreen.classList.remove('hidden'); // 結果画面を表示
        scoreDisplay.textContent = `${score} / ${questions.length}`; // スコアを表示
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startQuiz);
    trueButton.addEventListener('click', () => checkAnswer(true));
    falseButton.addEventListener('click', () => checkAnswer(false));
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++; // 次の問題へ
        displayQuestion(); // 次の問題を表示
    });
    restartButton.addEventListener('click', startQuiz); // 「もう一度プレイ」ボタン

    // ページ読み込み時にクイズデータを非同期でロード
    loadQuestions();
});