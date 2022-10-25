// uploads channels list to mongodb

const fs = require('fs');
const readline = require('readline');

const _db = require('./db');
const dbConfig = {
  url: 'mongodb://localhost',
  name: 'hundredmilchannels',
};
const db = new _db(dbConfig);
db.open();

let linesProcessed = 0;
let batchSize = 1000;
let batch = [];

const rl = readline.createInterface({
  input: fs.createReadStream('./mocks/channels-list.txt'),
  crlfDelay: Infinity
});

rl.on('line', async(line) => {
  batch.push({
    channelId: line,
    subscribers: 0,
    videos: 0,
    subscribersUpdatedAt: 0,
    videosUpdatedAt: 0,
  });
  if (batch.length === batchSize - 1) {
    db.addChannelMany(batch);
    batch = [];
  }
  linesProcessed++;
  if ((linesProcessed * 100) / 100000000 % 0.001 === 0) console.log(`${(linesProcessed * 100) / 100000000}%`);
});