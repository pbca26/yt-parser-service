const express = require('express');
const config = require('./config');
const path = require('path');

const app = express();
app.use(express.json());
app.listen(config.yt.port, () => {
  console.log('YT mock service is listening on port', config.yt.port);
});

app.get('/channel/:id', (req, res) => {
  console.log(req.params.id);
  res.sendFile(path.join(__dirname, './mocks/channel-subscribers.txt'));
});

app.get('/feed/:id', (req, res) => {
  console.log(req.params.id);
  res.sendFile(path.join(__dirname, './mocks/channel-feed.txt'));
});

app.get('/video/:id', (req, res) => {
  console.log(req.params.id);
  res.sendFile(path.join(__dirname, './mocks/channel-video.txt'));
});