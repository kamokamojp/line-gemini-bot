const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

// JSON受信設定
app.use(express.json());

// Webhookルート
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  // 応答処理
  try {
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;

        // Gemini API呼び出し
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{ text: userMessage }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Geminiの返答取り出し
        const replyText =
          geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text
          || 'うまく応答できませんでした。';

        // LINE返信
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('エラー:', err);
    res.sendStatus(500);
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
