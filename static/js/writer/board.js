/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(window.location.search);
const me = params.get("me");

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
document.getElementById("full")?.addEventListener("click", () =>
  document.documentElement.requestFullscreen?.()
);

/* ===========================
   WEBSOCKET
=========================== */
const protocol = location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(
  protocol + location.host + `/ws/chat/${me}/`
);

socket.onopen = () => console.log("✅ Board connected");

/* ===========================
   RECEIVE DATA
=========================== */
let lastPos = null;

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

socket.onmessage = e => {
  const d = JSON.parse(e.data);

  if (d.type === "draw") {
    draw(
      d.x * canvas.width,
      d.y * canvas.height,
      d.dragging,
      d.color,
      d.size
    );
  }

  if (d.type === "clear") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
  }
};
