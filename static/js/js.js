/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(window.location.search);
const room = params.get("room");
const role = params.get("role");   // writer / board

if (!room) {
  alert("Invalid room");
  throw new Error("Room missing");
}

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
   WEBSOCKET (ROOM BASED)
=========================== */
const protocol = location.protocol === "https:" ? "wss://" : "ws://";

const socket = new WebSocket(
  `${protocol}${location.host}/ws/chat/${room}/`
);

socket.onopen = () => {
  console.log("✅ Connected to room:", room);
  if (role === "writer") enterFullScreen();
};

socket.onerror = e => console.error("WS error", e);
socket.onclose = () => console.warn("WS closed");

/* ===========================
   DRAW HELPERS
=========================== */
let isDrawing = false;
let lastPos = null;

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: x - r.left, y: y - r.top };
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
   RECEIVE DATA (BOARD + WRITER)
=========================== */
socket.onmessage = e => {
  const d = JSON.parse(e.data);

  if (d.type === "draw") {
    draw(d.x, d.y, d.dragging, d.color, d.size);
  }

  if (d.type === "clear") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
  }
};

/* ===========================
   FAST SEND (WRITER ONLY)
=========================== */
let pending = null;
let raf = false;

function queue(x, y, drag) {
  pending = {
    x: x / canvas.width,
    y: y / canvas.height,
    dragging: drag,
    color: document.getElementById("color")?.value || "#000",
    size: +document.getElementById("size")?.value || 4
  };

  if (!raf) {
    raf = true;
    requestAnimationFrame(flush);
  }
}

function flush() {
  if (pending && socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: "draw",
      ...pending
    }));
    pending = null;
  }
  raf = false;
}

/* ===========================
   WRITER EVENTS
=========================== */
if (role === "writer") {

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const p = getPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
         color.value, +size.value);
    queue(p.x, p.y, false);
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing) return;
    const p = getPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
         color.value, +size.value);
    queue(p.x, p.y, true);
  });

  ["mouseup","mouseleave"].forEach(ev =>
    canvas.addEventListener(ev, () => isDrawing = false)
  );

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    isDrawing = true;
    const p = getPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, false,
         color.value, +size.value);
    queue(p.x, p.y, false);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPos(e);
    draw(p.x / canvas.width, p.y / canvas.height, true,
         color.value, +size.value);
    queue(p.x, p.y, true);
  });

  canvas.addEventListener("touchend", () => isDrawing = false);

  window.clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
    socket.send(JSON.stringify({ type: "clear" }));
  };
}

/* ===========================
   TOOL VISIBILITY
=========================== */
const tools = document.getElementById("tools");
if (tools) {
  tools.style.display = role === "board" ? "none" : "block";
  document.getElementById("full").style.display =
      role === "board" ? "block" : "none";
}

/* ===========================
   MOBILE BAR HIDE
=========================== */
setTimeout(() => window.scrollTo(0, 1), 100);
