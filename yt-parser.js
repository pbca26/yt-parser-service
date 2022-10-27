const fetch = require('node-fetch');
const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser();
const utils = require('./utils');
const config = require('./config');

// parse yt page and get subs count
const parseSubs = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(10000, 200000000);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:${config.yt.port}/channel/${data.id}`)
    .then((response) => response.text())
    .then((data) => {
      const regex = new RegExp(/(?<=<yt-formatted-string id="subscriber-count" class="style-scope ytd-c4-tabbed-header-renderer" aria-label=")(.*)(?=">)/m);
      const split1 = data.match(regex);
      const split2 = split1[1].split('">');
      const split3 = split2[1].split('</yt-formatted-string>');
      const split4 = split3[0].split(' ');
      let multiplier = 1;

      if (split4[0].indexOf('M') > -1) multiplier = 1000000;
      if (split4[0].indexOf('K') > -1) multiplier = 1000;

      const subscribers = randomize ? randomPool : Number(split4[0].replace(',', '.').replace('K', '').replace('M', '')) * multiplier;
      resolve(subscribers);
    });
  });
};

// parse yt xml feed
const parseFeed = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(5, 300);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:${config.yt.port}/feed/${data.id}`)
    .then((response) => response.text())
    .then((xmldata) => {
      xmlParser.parseString(xmldata, (err, result) => {
        resolve(randomize ? randomPool : utils.channelIdToVideosCount(data.id));
      });
    });
  });
};

// parse yt page and get subs count
const parseViews = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(100, 10000000);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:${config.yt.port}/video/${data.id}`)
    .then((response) => response.text())
    .then((data) => {
      const split1 = data.split('<span class="view-count style-scope ytd-video-view-count-renderer">');
      const split2 = split1[1].split('</span>');
      const views = randomize ? randomPool : split2[0].replace(/\D/g, '');
      resolve(views);
    });
  });
};

module.exports = {
  parseSubs,
  parseFeed,
  parseViews,
};