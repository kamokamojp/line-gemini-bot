const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数からLINE設定を取得
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Webhookのエンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
      }

      const userMessage = event.message.text;

      // OpenRouter + DeepSeek-Chatへのリクエスト
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'あなたはユーモアと親しみやすさを持ったLINE用会話アシスタントです。' },
            { role: 'user', content: userMessage },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const reply = response?.data?.choices?.[0]?.message?.content || 'すみません、うまく返答できませんでした。';

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `🧠 ${reply}`,
      });
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error('Webhookエラー:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
