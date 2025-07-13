const { Pool } = require('pg'); // PostgreSQLを使うためのライブラリ
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config(); // .envファイルから環境変数を読み込むために追加

// インポートするCSVファイルのパス
const CSV_FILE_PATH = './questions.csv'; // ★CSVファイル名が異なる場合はここを修正★

// PostgreSQLデータベース接続の設定
// Renderにデプロイする際はRender側でDATABASE_URLを設定します。
// ローカルでテストする場合は、直接connectionStringを記述するか、
// .envファイルにDATABASE_URLを設定してください。
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // Renderの無料枠でSSL証明書のエラーが出る場合、falseに設定することが多いです。
        // 本番環境ではtrueにすることが推奨されます。
        rejectUnauthorized: false 
    }
});

async function importData() {
    const client = await pool.connect(); // データベース接続を取得
    try {
        console.log('クイズデータベースに接続しました。');

        // 既存のquestionsテーブルを削除し、新しく作成
        // これにより、毎回最新のCSVデータでデータベースを初期化します。
        await client.query(`DROP TABLE IF EXISTS questions`);
        console.log('既存のquestionsテーブルを削除しました（存在しない場合はスキップ）。');

        await client.query(`CREATE TABLE questions (
            id INTEGER PRIMARY KEY, -- import_dataではCSVのIDを使うのでSERIALにしない
            question TEXT NOT NULL,
            answer BOOLEAN NOT NULL,
            explanation TEXT,
            genre TEXT,
            year INTEGER
        )`);
        console.log('questionsテーブルを新しく作成しました。');

        // CSVファイルを読み込み、データを挿入
        const results = [];
        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // ここで全てのCSVデータが読み込まれるのを待ってからDBに挿入
                for (const row of results) {
                    try {
                        const answerValue = (parseInt(row.answer, 10) === 1); // CSVの真偽値をBooleanに変換
                        await client.query(
                            `INSERT INTO questions (id, question, answer, explanation, genre, year) VALUES ($1, $2, $3, $4, $5, $6)`,
                            [parseInt(row.id, 10), row.question, answerValue, row.explanation, row.genre, parseInt(row.year, 10)]
                        );
                        // console.log(`ID: ${row.id} の問題を挿入しました。`); // ログが多い場合はコメントアウト
                    } catch (err) {
                        console.error(`データの挿入エラー (ID: ${row.id}):`, err.message);
                    }
                }
                console.log('CSVデータのインポートが完了しました。');
                client.release(); // 全ての処理が終わったらクライアントをプールに戻す
                pool.end(); // プールを閉じる (スクリプトの終了)
            });

    } catch (err) {
        console.error('データベース操作エラー:', err.message);
        client.release(); // エラー時もクライアントをプールに戻す
    }
}

importData(); // 関数を実行