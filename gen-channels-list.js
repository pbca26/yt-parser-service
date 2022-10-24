// generates 100 million random channel IDs and writes them into a file

const fs = require('fs');
const utils = require('./utils');

const size = 100 * 1000000;
const batchSize = 100;
const file = fs.createWriteStream('./mocks/channels-list.txt');
let num = 0;

console.log(`generating ${size} items...`);

const generateBatch = () => {
  let batch = [];
  
  for (let i = 0; i < batchSize; i++) {
    batch.push(utils.genChannelID());
  }

  return batch;
};

const processBatch = () => {
  if ((num * batchSize * 100 / size) % 10 === 0 && (num * batchSize * 100 / size) > 5) console.log(`${num * batchSize * 100 / size}%`);

  const batch = generateBatch();

  if (num === size / batchSize) {
    file.write(batch.join('\n'), finishProcessing);
  } else {
    if (file.write(batch.join('\n') + '\n')) {
      num++;
      process.nextTick(processBatch);
    } else {
      num++;
      file.once('drain', processBatch);
    }
  }
};

const finishProcessing = () => {
  file.end();

  console.log('done');
}

processBatch(0);