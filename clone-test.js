const sizeof = require('object-sizeof');
const filesize = require('filesize');
const objectCopy = require('object-copy');
const deepCopy = require('deepcopy');
const clone = require('clone');
const lgmtClone = require('@logicamente.info/clone');
const fs = require('fs');
const si = require('systeminformation');

const TESTS = 10;
const ITERATIONS = 10 ** 6;

const average = {
  'lgmt-clone': 0,
  'json-parse': 0,
  'object-copy': 0,
  'deepcopy': 0,
  'clone': 0,
};

const data = {
  'lgmt-clone': [],
  'json-parse': [],
  'object-copy': [],
  'deepcopy': [],
  'clone': [],
};

const original = {
  literal: 1,
  array: [1],
  objects: [{ literal: 1 }, { literal: 1 }],
  child: {
    literal: 1,
    array: [1],
    objects: [{ literal: 1 }, { literal: 1 }],
  },
};

const originalSize = sizeof(original);

function native(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function test(index, cb) {
  for (let i = 0; i < TESTS; i++) {
    const start = new Date().getTime();
    for (let j = 0; j < ITERATIONS; j++)
      cb(original);
    const end = new Date().getTime();
    data[index].push((end - start) / 1000);
  }
  const sum = data[index].reduce((p, c) => p + c, 0);
  average[index] = (sum / TESTS).toFixed(4);
  console.log(index, average[index], 's (avg.) / ', sum.toFixed(4), 's (tot.)');
}

function saveTests() {
  const dFile = fs.openSync('./data.dat', 'w+');
  const aFile = fs.openSync('./avg.dat', 'w+');
  const libs = Object.keys(data);
  libs.forEach((lib, index) => {
    fs.writeFileSync(aFile, `${index} ${lib} ${average[lib]}\n`);
    data[lib].forEach((val) => {
      fs.writeFileSync(dFile, `${index} ${val}\n`);
    });
  });
  fs.closeSync(dFile);
  fs.closeSync(aFile);
}

(async () => {
  const cpu = await si.cpu();
  const memory = await si.memLayout();
  console.log('----------------------------');
  console.log('CPU', cpu.manufacturer, cpu.brand, '@', cpu.speed, 'GHz');
  console.log('Mem', filesize(memory[0].size), '@', memory[0].clockSpeed, 'MHz');
  console.log('----------------------------');
  console.log('Chunck size ', filesize(originalSize));
  console.log('Full tests', TESTS);
  console.log('Iterations/test', ITERATIONS);
  console.log('Throughput/test', filesize(originalSize * ITERATIONS));
  console.log('Throughput/lib', filesize(originalSize * ITERATIONS * TESTS));
  test('lgmt-clone', lgmtClone);
  test('json-parse', native);
  test('object-copy', (obj) => { const c = {}; objectCopy(c, obj) });
  test('deepcopy', deepCopy);
  test('clone', clone);
  saveTests();
})().then(process.exit);