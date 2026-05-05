// api.js — transport abstraction layer
// Option A: direct MQTT via mqtt.js CDN
// Option B (future): rewrite only this file to use fetch/WebSocket to backend

window.appState = window.appState || { status: null };

const _TOPIC_STATUS = "autopiletero/ecb32c94-65ca-4925-bdf9-a72ee7d84333/status";
const _TOPIC_CMD    = "autopiletero/ecb32c94-65ca-4925-bdf9-a72ee7d84333/cmd";

let _client = null;
let _cb = { onStatus: null, onConnected: null, onDisconnected: null };

function connect(config, onStatus, onConnected, onDisconnected) {
    if (_client) _client.end(true);

    _cb = { onStatus, onConnected, onDisconnected };

    _client = mqtt.connect(`wss://${config.host}:${config.port}/mqtt`, {
        username: config.user,
        password: config.pass,
        reconnectPeriod: 5000,
        connectTimeout: 10000
    });

    _client.on("connect", () => {
        _client.subscribe(_TOPIC_STATUS);
        if (_cb.onConnected) _cb.onConnected();
    });

    _client.on("message", (topic, payload) => {
        if (topic !== _TOPIC_STATUS) return;
        try {
            const data = JSON.parse(payload.toString());
            window.appState.status = data;
            if (_cb.onStatus) _cb.onStatus(data);
        } catch (e) {
            console.error("MQTT parse error:", e);
        }
    });

    _client.on("close", () => {
        if (_cb.onDisconnected) _cb.onDisconnected();
    });

    _client.on("error", (err) => {
        console.error("MQTT error:", err);
    });
}

function sendCommand(cmd) {
    if (!isConnected()) { console.warn("sendCommand: not connected"); return; }
    _client.publish(_TOPIC_CMD, JSON.stringify(cmd));
}

function disconnect() {
    if (_client) { _client.end(); _client = null; }
}

function isConnected() {
    return _client != null && _client.connected;
}
