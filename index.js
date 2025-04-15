const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const data = [];
let value = 'a';
let label = 'adding';
let classifier;

let options = {
  task: 'classification',
  debug: true
};

canvas.addEventListener('click', click);

window.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    label = 'training';
    train();
  } else {
    value = event.key;
  }
});

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function init() {
  initCanvas();
  classifier = ml5.neuralNetwork(options);
}

function train() {
  data.forEach(item => {
    let inputs = [item.x, item.y];
    let outputs = [item.value];
    classifier.addData(inputs, outputs);
  });
  classifier.normalizeData();
  classifier.train({ epochs: 50 }, () => {
    console.log('Model trained');
    label = 'trained';
    // classifier.save();
  });
}

function click(event) {
  const { top, left } = canvas.getBoundingClientRect();
  const x = event.clientX - left;
  const y = event.clientY - top;

  if (label === 'trained') {
    classify({ event, x, y });
  } else {
    addCircle({ event, x, y, value });
  }
}

function addCircle({ event, x, y, value }) {
  if (label == 'trained') {
    ctx.strokeStyle = 'red';
  } else {
    ctx.strokeStyle = 'black';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '30px Arial';
  ctx.beginPath();
  ctx.strokeText(value, x, y);
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  data.push({ x, y, value });
  ctx.stroke();
}

function classify({ x, y, event, value }) {
  const inputs = [x, y];
  classifier.classify(inputs, (results, error) => {
    if (error) {
      console.error(error);
      return;
    }
    gotResults({ event, x, y, results });
  });
}

function gotResults({ event, x, y, results }) {
  addCircle({ event, x, y, value: results[0].label });
}

init();



