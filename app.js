const canvas = document.createElement('canvas');
let vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);
let vh = Math.max(
  document.documentElement.clientHeight || 0,
  window.innerHeight || 0
);
canvas.width = vw;
canvas.height = vh;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

let spine = [];
let legsEndEffectors = [];
const distance = 5;
const joints = 100;
const headDistance = 40;
const speed = 3;
const ribDensity = 2;
let ribLength = 3;
const ribLengthMax = ribLength;
const legLength = 40;
const legDensity = 20;

for (let i = 0; i < joints; i++) {
  spine.push({ x: 50 + distance * i, y: 100 });
}

function resetLegPlacement(i, point1, point2) {
  const vector = { x: point1.x - point2.x, y: point1.y - point2.y };
  const l = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  const N1 = { x: -vector.y, y: vector.x };
  const N2 = { x: vector.y, y: -vector.x };

  let destination = {
    x: point2.x + 2 * N1.x * ribLength - vector.x * ribLength,
    y: point2.y + 2 * N1.y * ribLength - vector.y * ribLength,
  };

  if (
    Math.hypot(
      destination.x - legsEndEffectors[i][0].x,
      destination.y - legsEndEffectors[i][0].y
    ) >=
    2 * legLength
  ) {
    legsEndEffectors[i][0] = {
      x: point2.x + ((1.7 * N1.x) / l) * legLength + 5 * vector.x,
      y: point2.y + ((1.7 * N1.y) / l) * legLength + 5 * vector.y,
    };
  }

  destination = {
    x: point2.x + 2 * N2.x * ribLength - vector.x * ribLength,
    y: point2.y + 2 * N2.y * ribLength - vector.y * ribLength,
  };

  if (
    Math.hypot(
      destination.x - legsEndEffectors[i][1].x,
      destination.y - legsEndEffectors[i][1].y
    ) >=
    2 * legLength
  ) {
    legsEndEffectors[i][1] = {
      x: point2.x + ((1.7 * N2.x) / l) * legLength + 5 * vector.x,
      y: point2.y + ((1.7 * N2.y) / l) * legLength + 5 * vector.y,
    };
  }
}

for (let i = 0; i < joints; i++) {
  if (i % legDensity === 0 && i >= 2) {
    legsEndEffectors.push([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
    resetLegPlacement(i / legDensity - 1, spine[i - 1], spine[i]);
  }
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

function drawRib(ctx, point1, point2) {
  const vector = { x: point1.x - point2.x, y: point1.y - point2.y };
  const N1 = { x: -vector.y, y: vector.x };
  const N2 = { x: vector.y, y: -vector.x };
  ctx.quadraticCurveTo(
    point2.x + N1.x * ribLength,
    point2.y + N1.y * ribLength,
    point2.x + 2 * N1.x * ribLength - vector.x * ribLength,
    point2.y + 2 * N1.y * ribLength - vector.y * ribLength
  );
  ctx.moveTo(point2.x, point2.y);
  ctx.quadraticCurveTo(
    point2.x + N2.x * ribLength,
    point2.y + N2.y * ribLength,
    point2.x + 2 * N2.x * ribLength - vector.x * ribLength,
    point2.y + 2 * N2.y * ribLength - vector.y * ribLength
  );
  ctx.moveTo(point2.x, point2.y);
}

function intersectTwoCircles(x1, y1, r1, x2, y2, r2) {
  var centerdx = x1 - x2;
  var centerdy = y1 - y2;
  var R = Math.sqrt(centerdx * centerdx + centerdy * centerdy);
  if (!(Math.abs(r1 - r2) <= R && R <= r1 + r2)) {
    // no intersection
    return []; // empty list of results
  }
  // intersection(s) should exist

  var R2 = R * R;
  var R4 = R2 * R2;
  var a = (r1 * r1 - r2 * r2) / (2 * R2);
  var r2r2 = r1 * r1 - r2 * r2;
  var c = Math.sqrt((2 * (r1 * r1 + r2 * r2)) / R2 - (r2r2 * r2r2) / R4 - 1);

  var fx = (x1 + x2) / 2 + a * (x2 - x1);
  var gx = (c * (y2 - y1)) / 2;
  var ix1 = fx + gx;
  var ix2 = fx - gx;

  var fy = (y1 + y2) / 2 + a * (y2 - y1);
  var gy = (c * (x1 - x2)) / 2;
  var iy1 = fy + gy;
  var iy2 = fy - gy;

  // note if gy == 0 and gx == 0 then the circles are tangent and there is only one solution
  // but that one solution will just be duplicated as the code is currently written
  return [
    { x: ix1, y: iy1 },
    { x: ix2, y: iy2 },
  ];
}

function drawLeg(ctx, point1, point2, i) {
  const vector = { x: point1.x - point2.x, y: point1.y - point2.y };
  const l = Math.hypot(vector.x, vector.y);
  const N1 = { x: -vector.y, y: vector.x };
  const N2 = { x: vector.y, y: -vector.x };

  let destination = {
    x: point2.x + 2 * N1.x * ribLength - vector.x * ribLength,
    y: point2.y + 2 * N1.y * ribLength - vector.y * ribLength,
  };
  ctx.moveTo(destination.x, destination.y);

  resetLegPlacement(i, point1, point2);

  // Inverse Kinematics math
  destination = intersectTwoCircles(
    destination.x,
    destination.y,
    legLength,
    legsEndEffectors[i][0].x,
    legsEndEffectors[i][0].y,
    legLength
  )[1];

  ctx.lineTo(destination.x, destination.y);
  ctx.lineTo(legsEndEffectors[i][0].x, legsEndEffectors[i][0].y);

  ctx.moveTo(point2.x, point2.y);

  destination = {
    x: point2.x + 2 * N2.x * ribLength - vector.x * ribLength,
    y: point2.y + 2 * N2.y * ribLength - vector.y * ribLength,
  };
  ctx.moveTo(destination.x, destination.y);

  if (
    Math.hypot(
      destination.x - legsEndEffectors[i][1].x,
      destination.y - legsEndEffectors[i][1].y
    ) >=
    2 * legLength
  ) {
    resetLegPlacement(i, point1, point2);
  }

  // Inverse Kinematics math
  destination = intersectTwoCircles(
    destination.x,
    destination.y,
    legLength,
    legsEndEffectors[i][1].x,
    legsEndEffectors[i][1].y,
    legLength
  )[0];

  ctx.lineTo(destination.x, destination.y);
  ctx.lineTo(legsEndEffectors[i][1].x, legsEndEffectors[i][1].y);

  ctx.moveTo(point2.x, point2.y);
}

function drawSpine(ctx, spine) {
  ctx.clearRect(0, 0, vw, vh);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(spine[0].x, spine[0].y);
  ctx.arc(spine[0].x, spine[0].y, distance, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
  for (let i = 1; i < spine.length; i++) {
    ctx.lineTo(spine[i].x, spine[i].y);
    ctx.moveTo(spine[i].x, spine[i].y);
    if (i % ribDensity === 0 && i < 20) {
      ribLength = ribLengthMax * 0.2;
      drawRib(ctx, spine[i - 1], spine[i]);
    }
    if (i == 20) {
      ribLength = ribLengthMax;
    }
    if (i % ribDensity === 0 && i >= 20) {
      drawRib(ctx, spine[i - 1], spine[i]);
      ribLength = ribLength * 0.97;
    }
    if (i % legDensity === 0 && i >= 2) {
      drawLeg(ctx, spine[i - 1], spine[i], i / legDensity - 1);
    }
  }
  ctx.stroke();
  ribLength = ribLengthMax;
}

document.onmousemove = function (e) {
  processSpine(spine, e.clientX, e.clientY);
  drawSpine(ctx, spine);
};

document.ontouchmove = function (e) {
  processSpine(spine, e.touches[0].clientX, e.touches[0].clientY);
  drawSpine(ctx, spine);
};
