const express = require('express');
const axios = require('axios');
const { Client, middleware } = require('@line/bot-sdk');

const app = express();
const port = process.env.PORT || 3000;

// LINE Bot設定
const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new Client(lineConfig);

// JSONとミドルウェア設定
app.use(express.json());
app.use(middleware(lineConfig));

// Webhookエンドポイント
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  // 複数イベントがある場合に対応
  const results = await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      try {
        const geminiResponse = await getGeminiResponse(userMessage);

        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: geminiResponse || 'うまく返せなかったよ...',
        });
      } catch (err) {
        console.error('Geminiエラー:', err);
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: 'エラーが発生したみたい。少し待ってね。',
        });
      }
    }
  }));

  res.sendStatus(200); // LINEへ応答
});

// Gemini API呼び出し
async function getGeminiResponse(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await axios.post(url, body);
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
