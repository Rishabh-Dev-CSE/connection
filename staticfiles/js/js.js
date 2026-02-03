/* ===========================
   SAFETY GUARD (VERY IMPORTANT)
=========================== */
const canvas = document.getElementById("canvas");
if (!canvas) {
  console.warn("canvas.js loaded on non-canvas page");
  return;
}
const ctx = canvas.getContext("2d");

/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(window.location.search);
const myUsername = params.get("me");
const toUser = params.get("to");
const role = params.get("role");

/* ===========================
   CANVAS SETUP
=========================== */
ctx.lineJoin = "round";
ctx.lineCap = "round";

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ===========================
   FULLSCREEN (OPTIONAL)
=========================== */
function enterFullScreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
}

/* ===========================
   WEBSOCKET
=========================== */
const protocol = location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(
  protocol + location.host + "/ws/chat/" + myUsername + "/"
);

socket.onopen = () => {
  console.log("✅ WebSocket connected");
  enterFullScreen();
};

socket.onerror = e => console.error("❌ WebSocket error", e);
socket.onclose = () => console.warn("⚠️ WebSocket closed");

/* ===========================
   DRAW HELPERS
=========================== */
let isDrawing = false;
let lastPos = null;

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: x - rect.left, y: y - rect.top };
}

function draw(rx, ry, dragging, color, size) {
  const x = rx * canvas.width;
  const y = ry * canvas.height;

  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();

  if (dragging && lastPos) ctx.moveTo(lastPos.x, lastPos.y);
  else ctx.moveTo(x - 1, y);

  ctx.lineTo(x, y);
  ctx.stroke();
  lastPos = { x, y };
}

/* ===========================
   RECEIVE DATA
=========================== */
socket.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "draw") {
    draw(data.x, data.y, data.dragging, data.color, data.size);
  }

  if (data.type === "clear") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
  }
};

/* ===========================
   RAF THROTTLE SEND
=========================== */
let pending = null;
let raf = false;

function queueDraw(x, y, dragging) {
  pending = {
    x: x / canvas.width,
    y: y / canvas.height,
    dragging,
    color: document.getElementById("color")?.value || "#000",
    size: parseInt(document.getElementById("size")?.value || 3)
  };

  if (!raf) {
    raf = true;
    requestAnimationFrame(flushDraw);
  }
}

function flushDraw() {
  if (pending && socket.readyState === WebSocket.OPEN) {
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
   DRAW EVENTS (WRITER ONLY)
=========================== */
if (role === "writer") {

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
      document.getElementById("color")?.value || "#000",
      parseInt(document.getElementById("size")?.value || 3)
    );
    queueDraw(p.x, p.y, false);
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing) return;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
      document.getElementById("color")?.value || "#000",
      parseInt(document.getElementById("size")?.value || 3)
    );
    queueDraw(p.x, p.y, true);
  });

  canvas.addEventListener("mouseup", () => isDrawing = false);
  canvas.addEventListener("mouseleave", () => isDrawing = false);

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    isDrawing = true;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
      document.getElementById("color")?.value || "#000",
      parseInt(document.getElementById("size")?.value || 3)
    );
    queueDraw(p.x, p.y, false);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
      document.getElementById("color")?.value || "#000",
      parseInt(document.getElementById("size")?.value || 3)
    );
    queueDraw(p.x, p.y, true);
  });

  canvas.addEventListener("touchend", () => isDrawing = false);

  window.clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
    socket.send(JSON.stringify({ to: toUser, type: "clear" }));
  };
}

/* ===========================
   TOOL VISIBILITY
=========================== */
const tools = document.getElementById("tools");
if (tools) tools.style.display = role === "board" ? "none" : "block";

/* ===========================
   MOBILE ADDRESS BAR HIDE
=========================== */
setTimeout(() => window.scrollTo(0, 1), 100);
