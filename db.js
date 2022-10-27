const MongoClient = require('mongodb').MongoClient;
const constants = require('./constants');

class DBController {
  constructor(config) {
    this.dbName = config.name;
    this.dbUrl = config.url;
    this.client = null;
    this.db = null;
  }

  open() {
    const self = this;
  
    if (!this.client) {
      return new Promise(async(resolve, reject) => {
        const client = new MongoClient(self.url);
        await client.connect();

        const db = client.db(self.name);
        self.client = client;
        self.db = db;
        resolve(true);
      });
    }
  };
  
  close() {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.db = null;
    }
  };
  
  addChannel(data) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('channels')
        .updateOne(
          {
            channelId: data.channelId,
          }, {
            $set: {
              channelId: data.channelId,
              subscribers: 0,
              videos: 0,
            }
          },
          {upsert: true},
          (err, result) => {
            if (err) throw err;
            resolve(result);
          });
      }
    });
  };
  
  addChannelMany(data) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('channels')
        .insertMany(data, (err, result) => {
          if (err) throw err;
          resolve(result);
        });
      }
    });
  };
  
  updateChannel(data) {
    const self = this;
    const updateQuery = {};
  
    if (data.subscribers) {
      updateQuery.subscribers = data.subscribers;
      updateQuery.subscribersUpdatedAt = Date.now();
    }
  
    if (data.videos) {
      updateQuery.videos = data.videos;
      updateQuery.videosUpdatedAt = Date.now();
    }
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('channels')
        .updateOne(
          {
            channelId: data.channelId,
          }, {
            $set: updateQuery
          },
          {upsert: true},
          (err, result) => {
            if (err) throw err;
            resolve(result);
          });
      }
    });
  };
  
  getChannel(channelId) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('channels')
        .findOne(
          {
            channelId: channelId
          },
          {projection: {_id: 0}},
          (err, result) => {
            if (err) throw err;
            resolve(result);
          });
      }
    });
  };
  
  updateVideo(data) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('videos')
        .updateOne({
            videoId: data.videoId,
          },
          {
            $set: data.channelId ? {
              channelId: data.channelId,
              videoId: data.videoId,
              views: data.views,
              updatedAt: Date.now(),
            } : {
              videoId: data.videoId,
              views: data.views,
              updatedAt: Date.now(),
            }
          },
          {upsert: true},
          (err, result) => {
            if (err) throw err;
            resolve(result);
          });
      }
    });
  };
  
  getChannels(limit) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('channels')
        .find(
          {
            $or: [{
              subscribersUpdatedAt: { $lte: Date.now() - constants.CHANNEL_SUBS_INTERVAL * 1000 }
            },
            {
              subscribersUpdatedAt: { $exists: false }
            }],
          },
          {projection: {_id: 0}
        })
        .limit(limit ? limit : constants.CHANNEL_SUBS_QUEUE_SIZE_LIMIT)
        .toArray((err, result) => {
          if (err) throw err;
          resolve(result);
        });
      }
    });
  };
  
  getVideos(limit) {
    const self = this;
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('videos')
        .find(
          {
            $or: [{
              updatedAt: { $lte: Date.now() - constants.CHANNEL_VIDEO_INTERVAL * 1000 }
            },
            {
              updatedAt: { $exists: false }
            }],
          },
          {projection: {_id:0 }
        })
        .limit(limit ? limit : constants.CHANNEL_VIDEOS_QUEUE_SIZE_LIMIT)
        .toArray((err, result) => {
          if (err) throw err;
          resolve(result);
        });
      }
    });
  };
  
  updateVideoBulk(data) {
    const self = this;
    const bulkOperations = [];
  
    // use mongodb optimization to insert/update multiple records into db
    for (let i = 0; i < data.length; i++) {
      bulkOperations.push({
        updateOne: {
          'filter': {
            videoId: data[i].videoId,
          },
          'update': {
            $set: !data[i].hasOwnProperty('views') ? {
              channelId: data[i].channelId,
              videoId: data[i].videoId,
            } : {
              channelId: data[i].channelId,
              videoId: data[i].videoId,
              views: data[i].views,
              updatedAt: Date.now(),
            }
          },
          'upsert': true,
        }
      });
    }
  
  
    return new Promise((resolve, reject) => {
      if (self.db) {
        self.db.collection('videos')
        .bulkWrite(bulkOperations, (err, result) => {
          if (err) throw err;
          resolve(result);
        });
      }
    });
  };
};

module.exports = DBController;