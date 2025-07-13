const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // 追加：CORS（クロスオリジン）問題を解決するためのライブラリ
const app = express();
const port = 3000;

// CORSを有効にする設定
// これにより、ブラウザからサーバーへのアクセスが許可されます。
app.use(cors());

// index.html ファイルを配信するための設定
// ブラウザが http://localhost:3000/ にアクセスしたときに、
// このプロジェクトフォルダ内のindex.htmlを返すようにします。
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// データベースファイルのパス
// このファイルは、app.jsと同じフォルダに作成されます。
const DB_PATH = './quiz.db';

// データベースに接続
let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('データベース接続エラー:', err.message);
    }
    console.log('クイズデータベースに接続しました。');
});

// データベースの初期化（テーブル作成＆サンプルデータ挿入）
// アプリを初めて実行する際に、テーブルを作成し、
// もしまだデータがなければサンプル問題を挿入します。
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer BOOLEAN NOT NULL,
        explanation TEXT,
        genre TEXT,
        year INTEGER
    )`, (err) => {
        if (err) {
            console.error('テーブル作成エラー:', err.message);
        } else {
            console.log('questionsテーブルが準備できました。');
        }
    });

    // サンプルデータを挿入（開発初期用）
    // idが既に存在する場合は挿入しないようにしています。
    db.run(`INSERT OR IGNORE INTO questions (id, question, answer, explanation, genre, year) VALUES
    (1, '日本の首都はうんち！かもしれない。', TRUE, '東京が日本の首都です。', '地理', 2020),
    (3, 'パンダは肉食動物である。', FALSE, 'パンダは主に竹を食べます。', '動物', 2022)
    `, (err) => {
        if (err) {
            console.error('サンプルデータ挿入エラー:', err.message);
        } else {
            console.log('サンプルデータが挿入されました（既存の場合はスキップ）。');
        }
    });
});

// 全ての質問を取得するAPIエンドポイント
// ブラウザで http://localhost:3000/api/questions にアクセスすると、
// データベースに保存された問題データが表示されます。
app.get('/api/questions', (req, res) => {
    let sql = `SELECT * FROM questions`;
    const params = [];

    // 今後の拡張のためにコメントアウトしていますが、
    // ここにジャンルや出題年で絞り込むロジックを追加できます。
    // if (req.query.genre) {
    //     sql += ` WHERE genre = ?`;
    //     params.push(req.query.genre);
    // }
    // if (req.query.year) {
    //     sql += params.length > 0 ? ` AND year = ?` : ` WHERE year = ?`;
    //     params.push(req.query.year);
    // }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// サーバーを起動
// このアプリが動き出す「場所」と「ポート番号」を指定しています。
app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
    console.log(`クイズデータを確認するには、ブラウザで http://localhost:${port}/api/questions にアクセスしてください。`);
    console.log(`アプリの開始画面へは、ブラウザで http://localhost:${port}/ にアクセスしてください。`);
});