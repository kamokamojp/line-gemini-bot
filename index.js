const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(
    events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
      }

      const userMessage = event.message.text;

      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'あなたは親しみやすくユーモアのあるLINEの会話アシスタントです。' },
              { role: 'user', content: userMessage }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const replyText = response.data.choices[0].message.content;

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `🤖 ${replyText}`
        });
      } catch (error) {
        console.error('OpenRouter APIエラー:', error.response?.data || error.message);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '⚠️ エラーが発生しました。後でもう一度お試しください。'
        });
      }
    })
  );

  res.status(200).json(results);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
