/* ===========================
   ROOM + SIGNALING
=========================== */
const room = new URLSearchParams(location.search).get("room");

const ws = new WebSocket(
  (location.protocol === "https:" ? "wss://" : "ws://") +
  location.host +
  "/ws/video/" + room + "/"
);

/* ===========================
   PEER CONNECTION (PREMIUM)
=========================== */
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
});

let localStream;
let makingOffer = false;
let polite = true; // important for glare handling

/* ===========================
   START CAMERA (HD + CLEAN)
=========================== */
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
}).then(stream => {
  localStream = stream;
  document.getElementById("localVideo").srcObject = stream;

  stream.getTracks().forEach(track =>
    pc.addTrack(track, stream)
  );
});

/* ===========================
   REMOTE STREAM
=========================== */
pc.ontrack = e => {
  document.getElementById("remoteVideo").srcObject = e.streams[0];
};

/* ===========================
   ICE HANDLING
=========================== */
pc.onicecandidate = e => {
  if (e.candidate) {
    ws.send(JSON.stringify({
      type: "ice",
      candidate: e.candidate
    }));
  }
};

pc.onconnectionstatechange = () => {
  console.log("Connection:", pc.connectionState);
  if (pc.connectionState === "failed") {
    pc.restartIce(); // premium reliability
  }
};

/* ===========================
   PERFECT NEGOTIATION
=========================== */
pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription(await pc.createOffer());
    ws.send(JSON.stringify({
      type: "offer",
      offer: pc.localDescription
    }));
  } finally {
    makingOffer = false;
  }
};

/* ===========================
   SIGNAL RECEIVE
=========================== */
ws.onmessage = async e => {
  const msg = JSON.parse(e.data);

  try {
    if (msg.type === "offer") {
      const offerCollision =
        makingOffer || pc.signalingState !== "stable";

      if (offerCollision && !polite) return;

      await pc.setRemoteDescription(msg.offer);
      await pc.setLocalDescription(await pc.createAnswer());

      ws.send(JSON.stringify({
        type: "answer",
        answer: pc.localDescription
      }));
    }

    else if (msg.type === "answer") {
      await pc.setRemoteDescription(msg.answer);
    }

    else if (msg.type === "ice" && msg.candidate) {
      await pc.addIceCandidate(msg.candidate);
    }

  } catch (err) {
    console.warn("Signal error", err);
  }
};

/* ===========================
   CALL CONTROLS (PREMIUM)
=========================== */
function toggleMic() {
  localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
}

function toggleCamera() {
  localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
}

function endCall() {
  pc.getSenders().forEach(s => pc.removeTrack(s));
  pc.close();
  ws.close();
}
