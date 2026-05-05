// mqtt.js — credentials manager + autoConnect helper
// All pages that need connectivity call autoConnect() from here.
// Changing transport (Option B) only requires rewriting api.js, not this file.

const _CRED_KEY = "autopiletero_mqtt";

function loadCredentials() {
    try { return JSON.parse(localStorage.getItem(_CRED_KEY)); } catch { return null; }
}

function saveCredentials(cfg) {
    localStorage.setItem(_CRED_KEY, JSON.stringify(cfg));
}

// Called by every page on load. Returns false if no credentials configured.
function autoConnect(onStatus, onConnected, onDisconnected) {
    const cfg = loadCredentials();
    if (!cfg || !cfg.host || !cfg.user) return false;
    connect(cfg, onStatus, onConnected, onDisconnected);
    return true;
}

// ── mqtt.html page functions ──

function loadMqttPage() {
    const cfg = loadCredentials() || {};
    document.getElementById("mqttHost").value = cfg.host || "56d8a77abca04cab87702c63c7838867.s1.eu.hivemq.cloud";
    document.getElementById("mqttPort").value = cfg.port || 8884;
    document.getElementById("mqttUser").value = cfg.user || "";
    _refreshBadge();
}

function guardarMqtt() {
    const host     = document.getElementById("mqttHost").value.trim();
    const port     = parseInt(document.getElementById("mqttPort").value, 10);
    const user     = document.getElementById("mqttUser").value.trim();
    const passInput = document.getElementById("mqttPass").value;

    if (!host || !user) { showStatus("Host y usuario son requeridos", "red"); return; }
    if (isNaN(port) || port <= 0) { showStatus("Puerto inválido", "red"); return; }

    const existing = loadCredentials() || {};
    const cfg = { host, port, user, pass: passInput || existing.pass || "" };
    saveCredentials(cfg);

    disconnect();
    connect(cfg,
        null,
        () => { showStatus("Conectado correctamente", "green"); _refreshBadge(); },
        () => { showStatus("Error de conexión — revisá host, usuario y contraseña", "red"); _refreshBadge(); }
    );
}

function _refreshBadge() {
    const el = document.getElementById("connectionBadge");
    if (!el) return;
    if (isConnected()) {
        el.innerText = "● Conectado";
        el.style.color = "green";
    } else {
        el.innerText = "● Desconectado";
        el.style.color = "red";
    }
}
