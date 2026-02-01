const urlParams = new URLSearchParams(window.location.search);

const myUsername = urlParams.get("me");
const toUser = urlParams.get("to");
const role = urlParams.get("role");
const uniqueKey = `${myUsername}_${toUser}_${role}`;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const socket = new WebSocket("ws://" + window.location.host + "/ws/chat/" + myUsername + "/");

let isDrawing = false;
let lastPos = null;

function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function draw(relX, relY, dragging, color, size) {
  const x = relX * canvas.width;
  const y = relY * canvas.height;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (dragging && lastPos) {
    ctx.moveTo(lastPos.x, lastPos.y);
  } else {
    ctx.moveTo(x - 1, y);
  }
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.stroke();
  lastPos = { x, y };
}

socket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  if (data.type === "draw") {
    draw(data.x, data.y, data.dragging, data.color, data.size);
  }
  if (data.type === "clear") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
  }
};

// 👇 DRAWING ONLY IF role === 'writer'
if (role === "writer") {
  function sendDraw(x, y, dragging) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        to: toUser,
        type: "draw",
        x: x / canvas.width,
        y: y / canvas.height,
        dragging,
        color: document.getElementById("color").value,
        size: parseInt(document.getElementById("size").value),
      }));
    }
  }

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const pos = getPointerPos(e);
    draw(pos.x / canvas.width, pos.y / canvas.height, false, ctx.strokeStyle, ctx.lineWidth);
    sendDraw(pos.x, pos.y, false);
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    draw(pos.x / canvas.width, pos.y / canvas.height, true, ctx.strokeStyle, ctx.lineWidth);
    sendDraw(pos.x, pos.y, true);
  });

  canvas.addEventListener("mouseup", () => isDrawing = false);
  canvas.addEventListener("mouseleave", () => isDrawing = false);

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    isDrawing = true;
    const pos = getPointerPos(e);
    draw(pos.x / canvas.width, pos.y / canvas.height, false, ctx.strokeStyle, ctx.lineWidth);
    sendDraw(pos.x, pos.y, false);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    draw(pos.x / canvas.width, pos.y / canvas.height, true, ctx.strokeStyle, ctx.lineWidth);
    sendDraw(pos.x, pos.y, true);
  });

  canvas.addEventListener("touchend", () => isDrawing = false);

  window.clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPos = null;
    socket.send(JSON.stringify({ to: toUser, type: "clear" }));
  };
}


  //==========================

    function connect() {
      const me = document.getElementById('me').value.trim();
      const to = document.getElementById('to').value.trim();
      const role = document.getElementById('role').value;

      if (!me || !to) {
        alert("Please enter both usernames.");
        return;
      }

      window.location.href = `/canvas/?me=${me}&to=${to}&role=${role}`;
    }


    // --------------

    document.addEventListener('mousemove', (e) => {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    // Random RGB color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    bubble.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

    // Position bubble
    bubble.style.left = `${e.clientX - 15}px`;
    bubble.style.top = `${e.clientY - 15}px`;

    document.body.appendChild(bubble);

    // Remove after animation
    setTimeout(() => {
      bubble.remove();
    }, 1000);
  });

  const action = document.getElementById('tools');
  if (role === 'board'){
     action.style.display = 'none'
  }else{
     action.style.display = 'block'
  }
  