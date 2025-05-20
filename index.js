const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// LINEからのWebhookイベント受け取り
app.post('/webhook', (req, res) => {
  // イベント確認用ログ（本番はGemini処理など）
  console.log('Received webhook:', req.body.events);

  res.sendStatus(200); // ← LINEに「受け取ったよ」と返す！
});

// ポートで待機
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
