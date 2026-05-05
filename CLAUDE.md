# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Remote web app (GitHub Pages / Render) to control the **AutoPiletero** device — an ESP32-based automatic pool dosifier managing 3 peristaltic pumps: Cloro (Chlorine), Alguicida (Algaecide), Clarificante (Clarifier).

Communication is via **MQTT over WebSockets** through HiveMQ Cloud (no local network required).

## Architecture

```
Browser (GitHub Pages)
    │  MQTT over WSS (port 8884)
    ▼
HiveMQ Cloud Broker  (56d8a77abca04cab87702c63c7838867.s1.eu.hivemq.cloud)
    │  MQTT over TLS (port 8883)
    ▼
ESP32 AutoPiletero
```

Stack: **vanilla HTML/CSS/JS** + **mqtt.js v5 (CDN)**. No framework, no build step.

## Development

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
# or
python -m http.server 8080
```

No build, no transpilation, no package manager required.

## Transport abstraction — critical rule

All MQTT communication lives exclusively in `js/api.js`. UI modules never reference mqtt.js directly.

```
dashboard.js / scheduler.js / pileta.js
        │  calls: sendCommand(), autoConnect()
        ▼
      api.js   ← only file that knows about MQTT
        │
      mqtt.js (CDN, browser WebSocket → HiveMQ)
```

`js/mqtt.js` handles credentials (localStorage) and exposes `autoConnect()`. It is NOT the MQTT client — that's `api.js`.

**Option B migration**: rewrite only `api.js` (replace mqtt.js calls with fetch/WebSocket to backend). No UI files change.

### api.js interface (stable contract)
```javascript
connect(config, onStatus, onConnected, onDisconnected)
// config = { host, port, user, pass }
sendCommand(cmdObject)
disconnect()
isConnected()
```

### mqtt.js interface
```javascript
autoConnect(onStatus, onConnected, onDisconnected)  // loads creds from localStorage
loadCredentials() / saveCredentials(cfg)
guardarMqtt()        // used by mqtt.html page
```

## Script load order (every page)

```html
<script src="https://unpkg.com/mqtt@5/dist/mqtt.min.js"></script>  <!-- CDN first -->
<script src="/js/version.js"></script>
<script src="/js/tiempo.js"></script>   <!-- defines showStatus() -->
<script src="/js/api.js"></script>      <!-- defines connect/sendCommand/disconnect/isConnected -->
<script src="/js/mqtt.js"></script>     <!-- defines autoConnect/loadCredentials -->
<script src="/js/[page].js"></script>   <!-- page-specific logic -->
```

## MQTT topics

| Topic | Direction | Notes |
|-------|-----------|-------|
| `autopiletero/ecb32c94-65ca-4925-bdf9-a72ee7d84333/status` | ESP32 → Web | `retain=true` |
| `autopiletero/ecb32c94-65ca-4925-bdf9-a72ee7d84333/cmd` | Web → ESP32 | Commands as JSON |

## Status message schema (full, from ESP32)

```json
{
  "firmware": "3.1.0",
  "deviceName": "autoP",
  "uuid": "ecb32c94-65ca-4925-bdf9-a72ee7d84333",
  "horaDelDia": "10:09:40",
  "online": true,

  "estadoBombaCloro": false,
  "flujoBombaCloro": 90,
  "dosificacionModeCloro": "mililitro",
  "schedulerModeCloro": "TIME",
  "duracionDosificacionCloro": 3400,
  "intervalMinCloro": 210,
  "horaCloro": 15,
  "minutosCloro": 0,

  "estadoBombaAlguicida": false,
  "flujoBombaAlguicida": 90,
  "dosificacionModeAlguicida": "mililitro",
  "schedulerModeAlguicida": "TIME",
  "duracionDosificacionAlguicida": 1700,
  "intervalMinAlguicida": 9,
  "horaAlguicida": 21,
  "minutosAlguicida": 0,

  "estadoBombaClarificante": false,
  "flujoBombaClarificante": 90,
  "dosificacionModeClarificante": "mililitro",
  "schedulerModeClarificante": "TIME",
  "duracionDosificacionClarificante": 850,
  "intervalMinClarificante": 9,
  "horaClarificante": 0,
  "minutosClarificante": 10,

  "piletaLitros": 170000,
  "piletaDosisCloro": 3400,
  "piletaDosisAlguicida": 1700,
  "piletaDosisClarificante": 850,
  "wifi_configurada": true,
  "ota_en_progreso": false
}
```

Note: `flujoBomba` may come as string `"90"` — use `parseFloat()`.
When device disconnects, broker publishes LWT: `{ "online": false }`.

## Commands (Web → ESP32)

```javascript
// Request current state
{"cmd": "get_status"}

// Manual pump — bomba: 1=Cloro, 2=Alguicida, 3=Clarificante
{"cmd": "dosificar", "bomba": 1, "duracion": 500, "mode": "mililitro"}
// mode: "mililitro" | "segundo"

// Schedule — interval mode
{"cmd": "set_scheduler", "bomba": 1, "modo": "INTERVAL",
 "minutos_interval": 60, "duracionDosificacion": 400, "dosificacionMode": "mililitro"}

// Schedule — fixed time mode
{"cmd": "set_scheduler", "bomba": 1, "modo": "TIME",
 "hour": 21, "minute": 0, "duracionDosificacion": 400, "dosificacionMode": "mililitro"}

// OTA firmware
{"cmd": "ota_fw", "url": "https://...firmware.bin"}

// OTA filesystem
{"cmd": "ota_fs", "url": "https://...littlefs.bin"}
```

## Credentials

Stored in `localStorage` under key `autopiletero_mqtt` as `{ host, port, user, pass }`. Managed via `pages/mqtt.html`. Never hardcoded.
