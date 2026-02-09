let generatedLink = "";
let startLink = "";
let isCopied = false;

function generateRoom() {
    return Math.random().toString(36).substring(2, 10);
}

function connect() {
    const room = generateRoom();

    // PC = board
    startLink = `${window.location.origin}/writer/?room=${room}`;

    // Phone = writer
    generatedLink = `${window.location.origin}/board/?room=${room}`;

    document.getElementById("link").value = generatedLink;

    document.getElementById("copyBtn").style.display = "block";
}

function copyLink() {
    if (!generatedLink) return;

    navigator.clipboard.writeText(generatedLink);
    isCopied = true;

    document.getElementById("session").style.display = "block";
}

function startSession() {
    if (!isCopied) {
        alert("Copy link first");
        return;
    }

    window.location.href = startLink;
}
