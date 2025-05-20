const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// Webhookエンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(
    events.map(async (event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        // 単純な応答
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '✅ 応答テスト成功です！',
        });
      }
    })
  );

  res.status(200).json(results);
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
});
