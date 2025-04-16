const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const data = [];
let value = 'a';
let label = 'adding';
let classifier;
let time;

let options = {
  task: 'classification',
  debug: true
};

canvas.addEventListener('click', click);
canvas.addEventListener('mousemove', () => {
  if (!time) time = Date.now();

  if (Date.now() - time > 100) {
    const { top, left } = canvas.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    if (label === 'trained') {
      classify({ event, x, y, hover: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      data.forEach(item => {
        draw({ x: item.x, y: item.y, value: item.value });
      });
    }

    time = Date.now();
  }
});

window.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    label = 'training';
    train();
  } else if (event.key === ' ') {
    label = 'adding';
    value = 'a';
  } else {
    value = event.key;
  }
  updateStatus();
});

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
function updateStatus() {
  document.getElementById('status').textContent = `Mode: ${label} | Current label: ${value} | Data points: ${data.length}`;
}

function init() {
  initCanvas();
  classifier = ml5.neuralNetwork(options);
  updateStatus();
}

function train() {
  classifier = ml5.neuralNetwork(options);

  data.forEach(item => {
    let inputs = [item.x, item.y];
    let outputs = [item.value];
    classifier.addData(inputs, outputs);
  });
  classifier.normalizeData();
  classifier.train({ epochs: 50 }, () => {
    console.log('Model trained');
    label = 'trained';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStatus();
    // classifier.save();
  });
}

function click(event) {
  const { top, left } = canvas.getBoundingClientRect();
  const x = event.clientX - left;
  const y = event.clientY - top;

  if (label === 'trained') {
    classify({ x, y });
  } else {
    addCircle({ x, y, value });
  }
  updateStatus();
}

function addCircle({ x, y, value, hover = false }) {

  if (label == 'trained' && !hover) {
    ctx.save();
    ctx.strokeStyle = 'red';
    draw({ x, y, value });
    ctx.restore();
  } else if (hover && label == 'trained') {
    ctx.save();
    ctx.strokeStyle = 'blue';
    ctx.globalAlpha = 0.5;
    draw({ x, y, value });
    ctx.restore();
  } else {
    ctx.save();
    data.push({ x, y, value, trained: false });
    ctx.strokeStyle = 'grey';
    draw({ x, y, value });
    ctx.restore();
  }
}

function draw({ x, y, value }) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '30px Arial';
  ctx.beginPath();
  ctx.strokeText(value, x, y);
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
}

function classify({ x, y, event, value, hover = false }) {
  const inputs = [x, y];
  classifier.classify(inputs, (results, error) => {
    if (error) {
      console.error(error);
      return;
    }
    gotResults({ event, x, y, results, hover });
  });
}

function gotResults({ event, x, y, results, hover }) {
  addCircle({ event, x, y, value: results[0].label, hover });
}

init();



