const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let spine = [];
const distance = 10;
const joints = 50;
const headDistance = 20;
const speed = 2;
const ribDensity = 5;

for (let i = 0; i < joints; i++) {
  spine.push({ x: 50 + distance * i, y: 100 });
}

function constrainDistance(point, anchor, distance) {
  const vector = { x: point.x - anchor.x, y: point.y - anchor.y };
  const l = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  return {
    x: (vector.x / l) * distance + anchor.x,
    y: (vector.y / l) * distance + anchor.y,
  };
}

function processHead(head, x, y) {
  const vector = { x: x - head.x, y: y - head.y };
  const l = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  if (l > headDistance) {
    return {
      x: (vector.x / l) * speed + head.x,
      y: (vector.y / l) * speed + head.y,
    };
  } else {
    return head;
  }
}

function processSpine(spine, x, y) {
  spine[0] = processHead(spine[0], x, y);
  for (let i = 0; i < spine.length - 1; i++) {
    spine[i + 1] = constrainDistance(spine[i + 1], spine[i], distance);
  }
}

function drawSpine(ctx, spine) {
  ctx.clearRect(0, 0, 1000, 600);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(spine[0].x, spine[0].y);
  for (let i = 1; i < spine.length; i++) {
    ctx.lineTo(spine[i].x, spine[i].y);
    ctx.moveTo(spine[i].x, spine[i].y);
  }
  ctx.stroke();
}

canvas.addEventListener('mousemove', (event) => {
  processSpine(spine, event.offsetX, event.offsetY);
  drawSpine(ctx, spine);
});
