const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai'); // Gemini用なら不要
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express(); // ← これが必須！
const port = process.env.PORT || 3000;

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.use(express.json());

// Webhook
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userText = event.message.text;

      // Gemini呼び出し
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userText }] }],
          }),
        }
      );

      const json = await geminiResponse.json();
      const replyText =
        json.candidates?.[0]?.content?.parts?.[0]?.text || '返答が取得できませんでした';

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    }
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
