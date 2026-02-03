let generatedLink = "";
let startLink = "";
let isCopied = false;

function connect() {
    const me = document.getElementById("me").value.trim();
    const to = document.getElementById("to").value.trim();
    const role = document.getElementById("role").value;

    if (!me || !to) {
        alert("Enter both usernames");
        return;
    }

    // 🔁 opposite role decide karo
    const oppositeRole = role === "writer" ? "board" : "writer";

    // 🔹 current device (Start button)
    startLink =
        `${window.location.origin}/canvas/?me=${encodeURIComponent(me)}&to=${encodeURIComponent(to)}&role=${role}`;

    // 🔹 other device (Copy link)
    generatedLink =
        `${window.location.origin}/canvas/?me=${encodeURIComponent(to)}&to=${encodeURIComponent(me)}&role=${oppositeRole}`;

    document.getElementById("link").value = generatedLink;
}

function copyLink() {
    if (!generatedLink) {
        alert("Create link first");
        return;
    }

    navigator.clipboard.writeText(generatedLink);
    isCopied = true;

    alert("Link copied. Now click Start.");
    document.getElementById("startBtn").disabled = false;
}

function startSession() {
    if (!isCopied) {
        alert("Copy link first");
        return;
    }

    // ✅ ONLY current device opens canvas
    window.location.href = startLink;
}
