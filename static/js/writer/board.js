/* ===========================
   URL PARAMS
=========================== */
const params = new URLSearchParams(location.search);
const room = params.get("room");

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

/* ===========================
   DRAW STATE
=========================== */
let strokePoints = [];

/* ===========================
   SMOOTH DRAW
=========================== */
function drawSmooth(points) {
  if (points.length < 2) return;

  ctx.strokeStyle = points[0].color;
  ctx.lineWidth = points[0].size;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1].x + points[i].x) / 2;
    const midY = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(
      points[i - 1].x,
      points[i - 1].y,
      midX,
      midY
    );
  }

  ctx.lineTo(points.at(-1).x, points.at(-1).y);
  ctx.stroke();
}

/* ===========================
   RENDER LOOP
=========================== */
function render() {
  if (strokePoints.length > 1) {
    drawSmooth(strokePoints);
    strokePoints = [strokePoints.at(-1)];
  }
  requestAnimationFrame(render);
}
render();

/* ===========================
   RECEIVE DATA
=========================== */
socket.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "draw") {
    // supports single point OR batched data
    const data = Array.isArray(msg.data) ? msg.data : [msg];

    data.forEach(p => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;

      if (!p.dragging) strokePoints = [];

      strokePoints.push({
        x,
        y,
        color: p.color,
        size: p.size
      });
    });
  }

  if (msg.type === "clear") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokePoints = [];
  }
};
