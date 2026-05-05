// api.js — transport abstraction layer
// Option A: direct MQTT via mqtt.js CDN
// Option B (future): rewrite only this file to use fetch/WebSocket to backend

window.appState = window.appState || { status: null };

let _topicStatus = null;
let _topicCmd    = null;

let _client = null;
let _cb = { onStatus: null, onConnected: null, onDisconnected: null };

function connect(config, onStatus, onConnected, onDisconnected) {
    if (_client) _client.end(true);

    _topicStatus = `autopiletero/${config.uuid}/status`;
    _topicCmd    = `autopiletero/${config.uuid}/cmd`;
    _cb = { onStatus, onConnected, onDisconnected };

    _client = mqtt.connect(`wss://${config.host}:${config.port}/mqtt`, {
        username: config.user,
        password: config.pass,
        reconnectPeriod: 5000,
        connectTimeout: 10000
    });

    _client.on("connect", () => {
        _client.subscribe(_topicStatus);
        if (_cb.onConnected) _cb.onConnected();
    });

    _client.on("message", (topic, payload) => {
        if (topic !== _topicStatus) return;
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
    _client.publish(_topicCmd, JSON.stringify(cmd));
}

function disconnect() {
    if (_client) { _client.end(); _client = null; }
}

function isConnected() {
    return _client != null && _client.connected;
}
