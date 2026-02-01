/* ===========================
   URL PARAMS
=========================== */
const urlParams = new URLSearchParams(window.location.search);
const myUsername = urlParams.get("me");
const toUser = urlParams.get("to");
const role = urlParams.get("role");

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
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

/* ===========================
   WEBSOCKET
=========================== */
const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(
  protocol + window.location.host + "/ws/chat/" + myUsername + "/"
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

function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const y = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return { x: x - rect.left, y: y - rect.top };
}

function draw(relX, relY, dragging, color, size) {
  const x = relX * canvas.width;
  const y = relY * canvas.height;

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
   FAST SEND (RAF THROTTLE)
=========================== */
let pendingPoint = null;
let rafRunning = false;

function queueDraw(x, y, dragging) {
  pendingPoint = {
    x: x / canvas.width,
    y: y / canvas.height,
    dragging,
    color: document.getElementById("color").value,
    size: parseInt(document.getElementById("size").value),
  };

  if (!rafRunning) {
    rafRunning = true;
    requestAnimationFrame(flushDraw);
  }
}

function flushDraw() {
  if (pendingPoint && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      to: toUser,
      type: "draw",
      ...pendingPoint
    }));
    pendingPoint = null;
  }
  rafRunning = false;
}

/* ===========================
   DRAW EVENTS (WRITER ONLY)
=========================== */
if (role === "writer") {

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
         document.getElementById("color").value,
         parseInt(document.getElementById("size").value));
    queueDraw(p.x, p.y, false);
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing) return;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
         document.getElementById("color").value,
         parseInt(document.getElementById("size").value));
    queueDraw(p.x, p.y, true);
  });

  canvas.addEventListener("mouseup", () => isDrawing = false);
  canvas.addEventListener("mouseleave", () => isDrawing = false);

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    isDrawing = true;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
         document.getElementById("color").value,
         parseInt(document.getElementById("size").value));
    queueDraw(p.x, p.y, false);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPointerPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
         document.getElementById("color").value,
         parseInt(document.getElementById("size").value));
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
   CONNECT PAGE REDIRECT
=========================== */
function connect() {
  const me = document.getElementById("me").value.trim();
  const to = document.getElementById("to").value.trim();
  const role = document.getElementById("role").value;

  if (!me || !to) return alert("Enter both usernames");

  window.location.href = `/canvas/?me=${me}&to=${to}&role=${role}`;
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
