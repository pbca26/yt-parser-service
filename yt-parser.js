const fetch = require('node-fetch');
const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser();
const utils = require('./utils');

// parse yt page and get subs count
const parseSubs = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(10000, 200000000);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:3111/channel/${data.id}`)
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

      console.log('subs', subscribers)
      resolve(subscribers);
    });
  });
};

//parseSubs(0, true);

// parse yt xml feed
const parseFeed = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(5, 300);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:3111/feed/${data.id}`)
    .then((response) => response.text())
    .then((xmldata) => {
      xmlParser.parseString(xmldata, (err, result) => {
        /*console.log(result.feed);
        console.log(result.feed.entry);
        console.log('video len', result.feed.entry.length);*/

        //resolve(randomize ? randomPool : result.feed.entry.length);
        resolve(randomize ? randomPool : utils.channelIdToVideosCount(data.id));
      });
    });
  });
};

//parseFeed();

// parse yt page and get subs count
const parseViews = (data, randomize) => {
  const randomPool = utils.getRandomIntInclusive(100, 10000000);

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:3111/video/${data.id}`)
    .then((response) => response.text())
    .then((data) => {
      //console.log(data)
      const split1 = data.split('<span class="view-count style-scope ytd-video-view-count-renderer">');
      const split2 = split1[1].split('</span>');
      const views = randomize ? randomPool : split2[0].replace(/\D/g, '');
      console.log('views', views)
      resolve(views);
    });
  });
};

//parseViews(0, true);

module.exports = {
  parseSubs,
  parseFeed,
  parseViews,
};