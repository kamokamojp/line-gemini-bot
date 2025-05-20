const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');
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
        const userMessage = event.message.text;

        try {
          // OpenRouter 経由で DeepSeek-Chat へ問い合わせ
          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: 'あなたは親しみやすくユーモアのあるLINEボットです。',
                },
                {
                  role: 'user',
                  content: userMessage,
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const replyText = response.data.choices[0].message.content;

          // LINEに返答
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `🤖 ${replyText}`,
          });
        } catch (error) {
          console.error('OpenRouterエラー:', error.response?.data || error.message);

          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '⚠️ エラーが発生しました。しばらくしてからもう一度お試しください。',
          });
        }
      }
    })
  );

  res.status(200).json(results);
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
