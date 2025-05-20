const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数の読み込み
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  try {
    await Promise.all(events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return; // テキスト以外はスルー
      }

      const userMessage = event.message.text;

      // OpenRouter 経由で DeepSeek-Chat に問い合わせ
      const openrouterResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'あなたは親しみやすくユーモアもあるLINE会話アシスタントです。' },
            { role: 'user', content: userMessage },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply = openrouterResponse.data.choices?.[0]?.message?.content;

      if (!botReply) {
        console.error('❌ Botの返答が取得できませんでした。', openrouterResponse.data);
        return;
      }

      // LINE に返信
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `🧠 ${botReply}`,
      });
    }));

    res.sendStatus(200);
  } catch (error) {
    console.error('🔴 Webhook処理中にエラー発生:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
