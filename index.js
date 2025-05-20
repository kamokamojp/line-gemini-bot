const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// LINE SDK のミドルウェア（署名検証付き）
app.post('/webhook', middleware(config), (req, res) => {
  console.log('Received webhook:', req.body.events);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
