const csv = require('csv-parser');
const fs = require('fs');

// データベースファイルのパス
const DB_PATH = './quiz.db';
// インポートするCSVファイルのパス (quiz-appフォルダに保存したCSVファイル名)
const CSV_FILE_PATH = './questions.csv'; // ★CSVファイル名が異なる場合はここを修正★

let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('データベース接続エラー:', err.message);
        return; // エラーがあればここで処理を停止
    }
    console.log('クイズデータベースに接続しました。');

    // データベースの初期化とデータ挿入の開始
    db.serialize(() => {
        // 既存のquestionsテーブルを削除 (もしあれば)
        db.run(`DROP TABLE IF EXISTS questions`, (err) => {
            if (err) {
                console.error('既存テーブル削除エラー:', err.message);
                // エラーが発生しても処理を続行 (テーブルがないだけの場合もあるため)
            } else {
                console.log('既存のquestionsテーブルを削除しました（存在しない場合はスキップ）。');
            }

            // 新しくquestionsテーブルを作成
            db.run(`CREATE TABLE questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                answer BOOLEAN NOT NULL,
                explanation TEXT,
                genre TEXT,
                year INTEGER
            )`, (err) => {
                if (err) {
                    console.error('テーブル作成エラー:', err.message);
                    db.close(); // エラーがあればデータベースを閉じる
                    return;
                }
                console.log('questionsテーブルを新しく作成しました。');

                // CSVファイルを読み込み、データを挿入
                fs.createReadStream(CSV_FILE_PATH)
                    .pipe(csv())
                    .on('data', (row) => {
                        const answerValue = parseInt(row.answer, 10);
                        db.run(`INSERT INTO questions (id, question, answer, explanation, genre, year) VALUES (?, ?, ?, ?, ?, ?)`,
                            [row.id, row.question, answerValue, row.explanation, row.genre, row.year],
                            function(err) {
                                if (err) {
                                    console.error(`データの挿入エラー (ID: ${row.id}):`, err.message);
                                }
                            }
                        );
                    })
                    .on('end', () => {
                        console.log('CSVデータのインポートが完了しました。');
                        db.close((err) => {
                            if (err) console.error('データベース切断エラー:', err.message);
                            else console.log('データベース接続を閉じました。');
                        });
                    })
                    .on('error', (error) => {
                        console.error('CSVファイルの読み込みエラー:', error.message);
                        db.close();
                    });
            });
        });
    });
});