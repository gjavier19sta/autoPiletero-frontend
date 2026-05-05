// Reloj del browser — reemplaza el fetch("/dayTime") del frontend local del ESP32

function showStatus(message, color = "green", messDuracionMSeg = 20) {
    const el = document.getElementById("statusMsg");
    if (!el) return;
    el.innerText = message;
    el.style.color = color;
    setTimeout(() => { el.innerText = ""; }, messDuracionMSeg * 1000);
}

function _tickClock() {
    const el = document.getElementById("horaDelDia");
    if (!el) return;
    el.innerText = new Date().toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
}

setInterval(_tickClock, 1000);
_tickClock();
