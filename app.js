const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQLを使うためのライブラリを追加
require('dotenv').config(); // .envファイルから環境変数を読み込むために追加

const app = express();
const port = process.env.PORT || 3000; // Renderが指定するポートを使うように修正

// CORSを有効にする設定
app.use(cors());

// index.html ファイルを配信するための設定
// ブラウザが http://localhost:3000/ にアクセスしたときに、
// このプロジェクトフォルダ内のindex.htmlを返すようにします。
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// PostgreSQLデータベース接続の設定
// Renderから取得したExternal Connection Stringを環境変数DATABASE_URLに設定します。
// ローカルでテストする場合、.envファイルにDATABASE_URLを設定してください。
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // 本番環境（Renderなど）ではSSL接続が必要になることが多いです。
        // rejectUnauthorized: false は開発・テスト用で、本番ではtrueにすることが推奨されます。
        // Renderの無料枠でSSL証明書のエラーが出る場合、falseに設定することがあります。
        rejectUnauthorized: false 
    }
});

// データベース接続のテスト
pool.connect((err, client, release) => {
    if (err) {
        return console.error('PostgreSQL接続エラー:', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // クライアントをプールに戻す
        if (err) {
            return console.error('PostgreSQLクエリエラー:', err.stack);
        }
        console.log('PostgreSQLデータベースに接続しました。現在時刻:', result.rows[0].now);
    });
});

// データベースの初期化（テーブル作成＆サンプルデータ挿入）関数
// アプリ起動時に、テーブルを作成し、もしまだデータがなければサンプル問題を挿入します。
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // 既存のquestionsテーブルを削除 (もしあれば)
        // デプロイごとにDBをクリアして入れ直したい場合に使うと便利ですが、
        // 永続化したい場合はこの行は削除またはコメントアウトしてください。
        await client.query(`DROP TABLE IF EXISTS questions`);
        console.log('既存のquestionsテーブルを削除しました（存在しない場合はスキップ）。');

        // 新しくquestionsテーブルを作成
        await client.query(`CREATE TABLE questions (
            id INTEGER PRIMARY KEY,
            question TEXT NOT NULL,
            answer BOOLEAN NOT NULL,
            explanation TEXT,
            genre TEXT,
            year INTEGER
        )`);
        console.log('questionsテーブルを新しく作成しました。');

        // サンプルデータを挿入（開発初期用）
        // idが既に存在する場合は挿入しないようにしています。
        const sampleQuestions = [
            { id: 1, question: '日本の首都は東京である。', answer: true, explanation: '東京が日本の首都です。', genre: '地理', year: 2020 },
            { id: 2, question: '地球は四角い。', answer: false, explanation: '地球は球体です。', genre: '科学', year: 2021 },
            { id: 3, question: 'パンダは肉食動物である。', answer: false, explanation: 'パンダは主に竹を食べます。', genre: '動物', year: 2022 }
        ];

        for (const q of sampleQuestions) {
            await client.query(`INSERT INTO questions (id, question, answer, explanation, genre, year) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
                [q.id, q.question, q.answer, q.explanation, q.genre, q.year]
            );
        }
        console.log('サンプルデータが挿入されました（既存の場合はスキップ）。');

    } catch (error) {
        console.error('データベース初期化エラー:', error.message);
    } finally {
        client.release(); // クライアントをプールに戻すことを忘れない
    }
}

// 全ての質問を取得するAPIエンドポイント
// ブラウザで http://localhost:3000/api/questions にアクセスすると、
// データベースに保存された問題データが表示されます。
app.get('/api/questions', async (req, res) => {
    let sql = `SELECT * FROM questions`;
    const params = [];

    // 今後の拡張のためにコメントアウトしていますが、
    // ここにジャンルや出題年で絞り込むロジックを追加できます。
    // if (req.query.genre) {
    //     sql += ` WHERE genre = $1`;
    //     params.push(req.query.genre);
    // }
    // if (req.query.year) {
    //     sql += params.length > 0 ? ` AND year = $${params.length + 1}` : ` WHERE year = $1`;
    //     params.push(req.query.year);
    // }

    try {
        const client = await pool.connect();
        const result = await client.query(sql, params);
        res.json({
            "message": "success",
            "data": result.rows
        });
        client.release(); // クライアントをプールに戻す
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// サーバーを起動
// このアプリが動き出す「場所」と「ポート番号」を指定しています。
app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
    console.log(`クイズデータを確認するには、ブラウザで http://localhost:${port}/api/questions にアクセスしてください。`);
    console.log(`アプリの開始画面へは、ブラウザで http://localhost:${port}/ にアクセスしてください。`);

    // サーバー起動時にデータベースを初期化（テーブル作成＆サンプルデータ挿入）
    initializeDatabase();
});