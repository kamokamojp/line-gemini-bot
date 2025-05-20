const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数から設定を読み込む
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Webhookエンドポイント
app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  console.log('🟡 受け取ったイベント:', JSON.stringify(events, null, 2));

  const results = await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      console.log('🟢 ユーザーのメッセージ:', userMessage);

      try {
        const openrouterResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'あなたは親しみやすく、ユーモアも交えたLINE用会話アシスタントです。' },
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

        const botReply = openrouterResponse.data.choices[0].message.content;
        console.log('🔵 Botの返答:', botReply);

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: botReply || '（返答が空でした）',
        });
      } catch (error) {
        console.error('🔴 OpenRouter エラー:', error.response?.data || error.message);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ごめんなさい、ただいま応答できません💦',
        });
      }
    } else {
      console.log('⚪ 他のタイプのイベントが来ました:', event.type);
    }
  }));

  res.status(200).json(results);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
