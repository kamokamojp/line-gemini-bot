const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// LINE Bot設定（環境変数から読み込み）
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Webhookエンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      try {
        // OpenRouter API（DeepSeek-Chat）に問い合わせ
        const openrouterResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'あなたは親しみやすく、ユーモアも交えたLINE用会話アシスタントです。',
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

        const botReply = openrouterResponse.data.choices[0].content;

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `🧠 ${botReply}`,
        });

      } catch (error) {
        console.error('OpenRouter API error:', error.response?.data || error.message);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `⚠️ エラーが発生しました：${error.message}`,
        });
      }
    }
  }));

  res.status(200).json(results);
});

// ポートで待機
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
