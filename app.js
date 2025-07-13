const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQLを使うためのライブラリ
require('dotenv').config(); // .envファイルから環境変数を読み込む

const app = express();
const port = process.env.PORT || 3000; // Renderが指定するポートを使うように設定

// CORSを有効にする設定 (全てのオリジンからのアクセスを許可)
app.use(cors());

// 静的ファイル（HTML, CSS, JavaScriptなど）を配信するための設定
// これにより、ブラウザが /style.css や /script.js にアクセスしたときに
// 自動的にquiz-appフォルダ内の対応するファイルを返します。
app.use(express.static(__dirname));

// index.html ファイルを配信するための設定 (app.use(express.static)があるので厳密には不要ですが、明示的に記述)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// PostgreSQLデータベース接続の設定
// Renderの環境変数 DATABASE_URL を使用します。
// ローカルでテストする場合は .env ファイルに設定してください。
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // 本番環境でのSSL接続エラー回避のため
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

// データベースの初期化（テーブル作成）関数
// この関数は、'questions' テーブルが存在しない場合にのみテーブルを作成します。
// ダミーデータの挿入や既存テーブルの削除はここで行いません。
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            question TEXT NOT NULL,
            answer BOOLEAN NOT NULL,
            explanation TEXT,
            genre TEXT,
            year INTEGER
        )`);
        console.log('questionsテーブルを確認しました（存在しない場合は作成）。');
    } catch (error) {
        console.error('データベース初期化エラー:', error.message);
    } finally {
        client.release(); // クライアントをプールに戻す
    }
}

// 全ての質問を取得するAPIエンドポイント
app.get('/api/questions', async (req, res) => {
    let sql = `SELECT * FROM questions`;
    const params = [];

    // 今後の拡張のためのコメントアウトですが、
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
app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
    console.log(`クイズデータを確認するには、ブラウザで http://localhost:${port}/api/questions にアクセスしてください。`);
    console.log(`アプリの開始画面へは、ブラウザで http://localhost:${port}/ にアクセスしてください。`);

    // サーバー起動時にデータベースのテーブル構造を確認・作成 (データは挿入しない)
    initializeDatabase();
});