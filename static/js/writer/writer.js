/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(location.search);
const room = params.get("room");
if (!room) throw new Error("Room missing");

/* ===========================
   CANVAS SETUP (Hi-DPI)
=========================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

/* ===========================
   WEBSOCKET
=========================== */
const protocol = location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(`${protocol}${location.host}/ws/chat/${room}/`);

socket.onopen = () => console.log("Premium writer connected");

/* ===========================
   STATE
=========================== */
let drawing = false;
let points = [];
let sendQueue = [];

const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");

/* ===========================
   HELPERS
=========================== */
function pos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: p.clientX - r.left, y: p.clientY - r.top };
}

function drawSmoothStroke(pts) {
  if (pts.length < 2) return;

  ctx.strokeStyle = pts[0].color;
  ctx.lineWidth = pts[0].size;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i - 1].x + pts[i].x) / 2;
    const midY = (pts[i - 1].y + pts[i].y) / 2;
    ctx.quadraticCurveTo(
      pts[i - 1].x,
      pts[i - 1].y,
      midX,
      midY
    );
  }

  ctx.lineTo(pts.at(-1).x, pts.at(-1).y);
  ctx.stroke();
}

/* ===========================
   RENDER LOOP
=========================== */
function render() {
  if (points.length > 1) {
    drawSmoothStroke(points);
    points = [points.at(-1)];
  }
  requestAnimationFrame(render);
}
render();

/* ===========================
   SEND LOOP (THROTTLED)
=========================== */
setInterval(() => {
  if (!sendQueue.length || socket.readyState !== 1) return;

  socket.send(JSON.stringify({
    type: "draw",
    data: sendQueue
  }));
  sendQueue = [];
}, 40);

/* ===========================
   POINTER EVENTS
=========================== */
function start(e) {
  drawing = true;
  const p = pos(e);
  const stroke = {
    x: p.x,
    y: p.y,
    color: colorInput.value,
    size: +sizeInput.value
  };
  points = [stroke];
  sendQueue.push(normalize(stroke, false));
}

function move(e) {
  if (!drawing) return;
  const p = pos(e);
  const stroke = {
    x: p.x,
    y: p.y,
    color: colorInput.value,
    size: +sizeInput.value
  };
  points.push(stroke);
  sendQueue.push(normalize(stroke, true));
}

function end() {
  drawing = false;
  points = [];
}

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", move);
canvas.addEventListener("mouseup", end);
canvas.addEventListener("mouseleave", end);

canvas.addEventListener("touchstart", e => { e.preventDefault(); start(e); });
canvas.addEventListener("touchmove", e => { e.preventDefault(); move(e); });
canvas.addEventListener("touchend", end);

/* ===========================
   NORMALIZE DATA
=========================== */
function normalize(p, drag) {
  return {
    x: p.x / canvas.width,
    y: p.y / canvas.height,
    dragging: drag,
    color: p.color,
    size: p.size
  };
}

/* ===========================
   CLEAR
=========================== */
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.send(JSON.stringify({ type: "clear" }));
}
