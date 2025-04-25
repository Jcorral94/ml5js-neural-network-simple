const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const data = [];
const trainedResults = []; // holds prediction clicks only, not hover
let value = 'a';
let label = 'adding';
let classifier;
let time;
let hover = false;
let hovertimeout;

let options = {
  task: 'classification',
  debug: true
};

canvas.addEventListener('click', click);
canvas.addEventListener('mousemove', () => {
  if (!time) time = Date.now();

  if (Date.now() - time > 25) {
    const { top, left } = canvas.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    if (label === 'trained') {
      // ⬇️ Moved clear + redraw above classify so the canvas is fresh
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      trainedResults.forEach(item => {
        draw({ x: item.x, y: item.y, value: item.value, color: 'red' }); // ⬅️ draw past predictions
      });
      classify({ x, y, hover: true }); // ⬅️ moved down here
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
    hover = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.forEach(item => {
      draw({ x: item.x, y: item.y, value: item.value, color: 'grey' });
    });
  } else {
    value = event.key;
  }
  updateStatus();
});

function resetClassifier() {
  classifier = ml5.neuralNetwork(options);
}

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function updateStatus() {
  document.getElementById('status').textContent = `Mode: ${label} | Current label: ${value} | Data points: ${hover ? trainedResults.length : data.length}`;
}

function init() {
  initCanvas();
  resetClassifier();
  updateStatus();
}

function train() {
  resetClassifier();

  data.forEach(item => {
    let inputs = [item.x, item.y];
    let outputs = [item.value];
    classifier.addData(inputs, outputs);
  });

  classifier.normalizeData();
  classifier.train({ epochs: 50 }, () => {
    console.log('Model trained');
    label = 'trained';
    hover = true;
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
    // ⬇️ User clicked in trained mode → store result
    trainedResults.push({ x, y, value, trained: true }); // ✅ store only on click
    ctx.strokeStyle = 'red';
    ctx.globalAlpha = 1.0; // ✅ ensure alpha reset
    draw({ x, y, value, color: 'red' });
  } else if (hover && label == 'trained') {
    ctx.strokeStyle = 'blue';
    ctx.globalAlpha = 0.5;
    draw({ x, y, value, color: 'green', alpha: 0.9 }); // ✅ don't push
  } else {
    data.push({ x, y, value, trained: false });
    ctx.strokeStyle = 'grey';
    ctx.globalAlpha = 1.0; // ✅ ensure alpha reset
    draw({ x, y, value, color: 'grey' });
  }
  updateStatus();
}

function draw({ x, y, value, color = 'black', alpha = 1.0 }) {
  ctx.save(); // ✅ always isolate styles per draw
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '30px Arial';
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.strokeText(value, x, y);
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function classify({ x, y, event, value, hover = false }) {
  const inputs = [x, y];
  classifier.classify(inputs, (results, error) => {
    if (error) {
      console.error(error);
      return;
    }
    gotResults({ x, y, results, hover });
  });
}

function gotResults({ x, y, results, hover }) {
  addCircle({ x, y, value: results[0].label, hover });
}

init();
