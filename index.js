const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: "こんにちは！調子はどう？" }]
        }]
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "返答がありませんでした。";
    res.send(`Geminiの返答：${reply}`);
  } catch (error) {
    console.error('Gemini APIエラー:', error.response?.data || error.message);
    res.status(500).send('Gemini API 呼び出しに失敗しました。');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
