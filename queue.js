const { createClient } = require('redis');
const utils = require('./utils');

/*
 * we need 4 queues, 1 to push channel_ids, 2 to push channel subscribers, 3 to push yt_channel_video details, 4 to push video details
 */

let redisClient;
const MAX_CHANNELS_SIZE = 10;

const init = async() => {
  redisClient = createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
  /*await makeList(MAX_CHANNELS_SIZE, 'yt_channel_subscribers');
  await makeList(MAX_CHANNELS_SIZE, 'yt_channel_videos');
  await makeList(MAX_CHANNELS_SIZE, 'yt_video_info');*/
};

const makeList = async(name, data) => {
  const size = data.length;
  const itemsInList = await redisClient.lLen(name);

  console.log('itemsInList', itemsInList);

  for (let i = 0; i < MAX_CHANNELS_SIZE - itemsInList && MAX_CHANNELS_SIZE - itemsInList > 0; i++) {
    await redisClient.lPush(
      name,
      data[i]
      /*JSON.stringify({
        channelId: utils.genChannelID(),
        lastReadAt: 0, // timestamp
        status: 0, // 0 - pristine, 1 - ok, 2 - timeout/error
      })*/
    );
  }

  console.log(`list ${name} length: ${await redisClient.lLen(name)}.`);
}

const getOne = async name => {
  const item = await redisClient.lIndex(name, 0);

  console.log(`redis getOne ${name}`, item);
  await redisClient.lPop(name);
  return item;
};

const addOne = async (name, data) => {
  const item = await redisClient.lPush(name, data);

  console.log('addOne', item);
  return;
};

/*const makeStream = async(size, name) => {
  const totalChannelsInStream = await redisClient.xLen(name);

  console.log('totalChannelsInStream', totalChannelsInStream);

  for (let i = 0; i < size && size < totalChannelsInStream; i++) {
    await redisClient.xAdd(
      name,
      '*', // * = Let Redis generate a timestamp ID for this new entry.
      // Payload to add to the stream:
      {
        channelId: utils.genChannelID()

      }
    );
  }

  console.log(`stream length: ${await redisClient.xLen(name)}.`);
}*/

//init();

module.exports = {
  init,
  makeList,
  getOne,
  addOne,
};