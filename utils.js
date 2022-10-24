function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const _abc = 'abcdefghiklmnoprstuvwxyz';
const abc = _abc.split('');

// example: UCVNouUw3d3l5JYVCxhAQXKA
const channelIdLen = 24;
const maxDigits = 4;
const maxSymLC = 6;

// generate channel ID
const genChannelID = () => {
  let channelId = '';
  let digitCount = 0;
  let symLCCount = 0;

  for (let i = 0; i < channelIdLen; i++) {
    const symOrDigit = i !== 0 && digitCount <= maxDigits ? getRandomInt(2) : 0;
    let sym = abc[getRandomInt(abc.length - 1)].toUpperCase();

    if (!symOrDigit) {
      const uc = getRandomInt(2);
      
      if (uc && symLCCount <= maxSymLC) {
        sym = sym.toLowerCase();
        symLCCount++;
      }

      channelId += sym;
    } else {
      channelId += getRandomInt(9);
      digitCount++;
    }
  }

  return channelId;
};

const checkTimestamp = (dateToCheck, currentEpochTime = Date.now() / 1000) => {
  const secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

  return Math.abs(Math.floor(secondsElapsed));
};

// deterministic video count based on last 3 letters of channelId
const channelIdToVideosCount = (channelId) => {
  const substr = channelId.substr(channelId.length - 3, 3).toLowerCase();
  let videoCount = 0;

  for (let i = 0; i < substr.length; i++) {
    videoCount += (_abc.indexOf(substr[i]) > -1 ? _abc.indexOf(substr[i]) : substr[i] - 1) + 1;
  }

  return videoCount;
};

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
};

module.exports = {
  genChannelID,
  checkTimestamp,
  channelIdToVideosCount,
  getRandomIntInclusive,
};