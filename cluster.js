const express = require('express');
const port = 3000;
const cluster = require('cluster');
const totalCPUs = require('os').cpus().length;
//
const videoCluster = process.argv.indexOf('video') > -1;
const utils = require('./utils');
const constants = require('./constants');
const queue = require('./queue');
const ytParser = require('./yt-parser');
const _db = require('./db');
const dbConfig = {
  url: 'mongodb://localhost',
  name: 'hundredmilchannels',
};
const db = new _db(dbConfig);
db.open();
queue.init();

const workerMessageHandler = (msg) => {
  console.log('message from worker', msg);
  console.log(cluster.workers)
}

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);
 
  cluster.on('fork', (worker) => {
    console.log(`cluster worker forked with PID ${worker.process.pid}`);
  });

  // run two clusters with channel video info processing cluster occuping 70% of all cores and 30% allocated to channel info processing
  console.log(!videoCluster ? Math.floor(totalCPUs * 0.3) : Math.ceil(totalCPUs * 0.7))
  for (let i = 0; i < (!videoCluster ? Math.floor(totalCPUs * 0.3) : Math.ceil(totalCPUs * 0.7)); i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', workerMessageHandler);
  }
 
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log('Let\'s fork another worker!');
    cluster.fork();
  });
} else {
  const app = express();
  console.log(`Worker ${process.pid} started`);
 
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });

  const addChannels = async () => {
    const dbRes = await db.getChannels(constants.CHANNEL_SUBS_QUEUE_SIZE_LIMIT);
    const queueData = [];

    for (let i = 0; i < dbRes.length; i++) {
      console.log(utils.checkTimestamp(dbRes[i].subscribersUpdatedAt));
      queueData.push(dbRes[i].channelId);
    }

    console.log(queueData)

    if (queueData.length) {
      await queue.makeList('yt_channels_subcribers', queueData);
      await queue.makeList('yt_channels_videos_list', queueData);
    }
  };

  const processChannels = async () => {
    const channelIdSubs = await queue.getOne('yt_channels_subcribers');

    if (channelIdSubs) {
      console.log(channelIdSubs);
      const channelSubs = await ytParser.parseSubs({id: channelIdSubs}, true);
      console.log('channelSubs', channelSubs);
      await db.updateChannel({
        channelId: channelIdSubs,
        subscribers: channelSubs,
      });
    } else {
      await addChannels();
    }

    const channelIdVideos = await queue.getOne('yt_channels_videos_list');

    if (channelIdVideos) {
      const channelVideos = await ytParser.parseFeed({id: channelIdVideos});
      console.log('channelVideos', channelVideos);
      await db.updateChannel({
        channelId: channelIdVideos,
        videos: channelVideos,
      });

      const arr = [];

      for (let i = 0; i < channelVideos; i++) {
        arr.push({
          channelId: channelIdVideos,
          videoId: channelIdVideos + (i + 1),
        });
      }

      console.log(arr)

      await db.updateVideoBulk(arr);
      console.log('bulk video inserted for channel', channelIdVideos);
    }

    processChannels();
  };

  const addVideos = async () => {
    const dbRes = await db.getVideos(constants.CHANNEL_VIDEOS_QUEUE_SIZE_LIMIT);
    const queueData = [];

    for (let i = 0; i < dbRes.length; i++) {
      console.log(utils.checkTimestamp(dbRes[i].updatedAt));
      queueData.push(dbRes[i].videoId);
    }

    console.log(queueData)

    if (queueData.length) await queue.makeList('yt_channel_videos', queueData);
  };

  const processVideos = async () => {
    const videoId = await queue.getOne('yt_channel_videos');

    if (videoId) {
      console.log('videoId', videoId);
      const videoViews = await ytParser.parseViews({id: videoId}, true);
      console.log('videoViews', videoViews);
      await db.updateVideo({
        videoId: videoId,
        views: videoViews,
      });
    } else {
      await addVideos();
    }

    processVideos();
  };

  if (!videoCluster) {
    //processChannels();
  } else {
    processVideos();
  }
}