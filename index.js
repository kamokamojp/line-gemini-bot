const axios = require('axios');
const line = require('@line/bot-sdk');

const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
});

// LINE webhook
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userText = event.message.text;

      // Gemini API呼び出し
      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{ text: userText }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const geminiReply = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "返事が見つかりませんでした。";

        // LINEに返信
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: geminiReply
        });

      } catch (error) {
        console.error('Gemini API Error:', error);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'Geminiとの通信でエラーが発生しました。'
        });
      }
    }
  }

  res.sendStatus(200);
});
