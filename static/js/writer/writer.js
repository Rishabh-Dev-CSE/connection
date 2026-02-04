/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(window.location.search);
const me = params.get("me");
const toUser = params.get("to");

/* ===========================
   CANVAS SETUP
=========================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.lineJoin = "round";
ctx.lineCap = "round";

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ===========================
   FULLSCREEN
=========================== */
function enterFullScreen() {
  document.documentElement.requestFullscreen?.();
}

/* ===========================
   WEBSOCKET
=========================== */
const protocol = location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(
  protocol + location.host + `/ws/chat/${me}/`
);

socket.onopen = () => {
  console.log("✅ Writer connected");
  enterFullScreen();
};

socket.onerror = e => console.error("❌ WS error", e);

/* ===========================
   DRAW LOGIC
=========================== */
let isDrawing = false;
let lastPos = null;

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: x - r.left, y: y - r.top };
}

function draw(x, y, drag, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();

  if (drag && lastPos) ctx.moveTo(lastPos.x, lastPos.y);
  else ctx.moveTo(x - 1, y);

  ctx.lineTo(x, y);
  ctx.stroke();
  lastPos = { x, y };
}

/* ===========================
   FAST SEND (RAF)
=========================== */
let pending = null;
let raf = false;

function queue(x, y, drag) {
  pending = {
    x: x / canvas.width,
    y: y / canvas.height,
    dragging: drag,
    color: color.value,
    size: +size.value
  };

  if (!raf) {
    raf = true;
    requestAnimationFrame(flush);
  }
}

function flush() {
  if (pending && socket.readyState === 1) {
    socket.send(JSON.stringify({
      to: toUser,
      type: "draw",
      ...pending
    }));
    pending = null;
  }
  raf = false;
}

/* ===========================
   EVENTS
=========================== */
canvas.addEventListener("mousedown", e => {
  isDrawing = true;
  const p = getPos(e);
  draw(p.x, p.y, false, color.value, +size.value);
  queue(p.x, p.y, false);
});

canvas.addEventListener("mousemove", e => {
  if (!isDrawing) return;
  const p = getPos(e);
  draw(p.x, p.y, true, color.value, +size.value);
  queue(p.x, p.y, true);
});

["mouseup", "mouseleave"].forEach(ev =>
  canvas.addEventListener(ev, () => isDrawing = false)
);

/* ===========================
   CLEAR
=========================== */
window.clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lastPos = null;
  socket.send(JSON.stringify({ to: toUser, type: "clear" }));
};
