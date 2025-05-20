const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数からLINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Webhookエンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  try {
    const results = await Promise.all(events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
      }

      const userMessage = event.message.text;

      // OpenRouter (DeepSeek-Chat) API 呼び出し
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'あなたはLINE上で楽しく会話する親しみやすいAIアシスタントです。'
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const replyText = response.data.choices[0].message.content;

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText
      });
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error('Webhook処理エラー:', error.response?.data || error.message);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
