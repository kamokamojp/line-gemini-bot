const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const lineClient = new Client(config);

// LINEのWebhook受付
app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(events.map(handleEvent));
  res.json(results);
});

// メッセージ処理
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const replyMessage = await callGemini(userMessage);

  return lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: replyMessage
  });
}

// Gemini API呼び出し
async function callGemini(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `【キャラ設定】あなたは超ドSな女性コーチです。辛辣で上から目線の口調で次の内容に返答してください。\n\nユーザーの発言：「${text}」` }]
      }
    ]
  };

  try {
    const res = await axios.post(url, payload);
    const reply = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "黙ってないでちゃんと話しなさい。";
    return reply;
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    return 'Geminiとの通信でエラーが発生したわ。';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
