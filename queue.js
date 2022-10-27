const { createClient } = require('redis');

let redisClient;
const MAX_CHANNELS_SIZE = 10;

const init = async() => {
  redisClient = createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
};

const makeList = async(name, data) => {
  const itemsInList = await redisClient.lLen(name);


  for (let i = 0; i < MAX_CHANNELS_SIZE - itemsInList && MAX_CHANNELS_SIZE - itemsInList > 0; i++) {
    await redisClient.lPush(
      name,
      data[i]
    );
  }
}

const getOne = async name => {
  const item = await redisClient.lIndex(name, 0);

  await redisClient.lPop(name);
  return item;
};

const addOne = async (name, data) => {
  await redisClient.lPush(name, data);

  return;
};

module.exports = {
  init,
  makeList,
  getOne,
  addOne,
};