function dashInfo() {
    const ok = autoConnect(
        (data) => {
            console.log("[dashboard] status recibido:", data);
            syncStatus(data);
        },
        () => {
            console.log("[dashboard] conectado al broker");
            _setDeviceBadge(true);
            sendCommand({ cmd: "get_status" });
        },
        () => {
            console.log("[dashboard] desconectado del broker");
            _setDeviceBadge(false);
        }
    );
    console.log("[dashboard] autoConnect retornó:", ok);
    if (!ok) showStatus("Configurá la conexión MQTT primero → menú Configurar Conexión", "red", 60);
}

function _setDeviceBadge(online) {
    const el = document.getElementById("deviceStatus");
    if (!el) return;
    el.innerText = online ? "● Online" : "● Offline";
    el.style.color = online ? "green" : "red";
}

function syncStatus(data) {
    if (!data) return;

    _setDeviceBadge(data.online !== false);

    // Cloro
    document.getElementById("estadoBombaCloro").innerText      = data.estadoBomba ? "ON" : "OFF";
    document.getElementById("estadoBombaCloro").style.color    = data.estadoBomba ? "green" : "red";
    document.getElementById("flujoBombaCloro").innerText       = data.flujoBomba || "--";
    document.getElementById("duracionDosificacionCloro").value = data.duracionDosificacion || "";
    document.getElementById("dosificacionModeCloro").value     = data.dosificacionMode || "mililitro";

    // Alguicida
    document.getElementById("estadoBombaAlguicida").innerText      = data.estadoBombaAlguicida ? "ON" : "OFF";
    document.getElementById("estadoBombaAlguicida").style.color    = data.estadoBombaAlguicida ? "green" : "red";
    document.getElementById("flujoBombaAlguicida").innerText       = data.flujoBombaAlguicida || "--";
    document.getElementById("duracionDosificacionAlguicida").value = data.duracionDosificacionAlguicida || "";
    document.getElementById("dosificacionModeAlguicida").value     = data.dosificacionModeAlguicida || "mililitro";

    // Clarificante
    document.getElementById("estadoBombaClarificante").innerText      = data.estadoBombaClarificante ? "ON" : "OFF";
    document.getElementById("estadoBombaClarificante").style.color    = data.estadoBombaClarificante ? "green" : "red";
    document.getElementById("flujoBombaClarificante").innerText       = data.flujoBombaClarificante || "--";
    document.getElementById("duracionDosificacionClarificante").value = data.duracionDosificacionClarificante || "";
    document.getElementById("dosificacionModeClarificante").value     = data.dosificacionModeClarificante || "mililitro";

    document.body.style.background =
        (data.estadoBomba || data.estadoBombaAlguicida || data.estadoBombaClarificante) ? "#e6ffe6" : "white";
}

function dosificar(bomba) {
    const sufijos = { 1: "Cloro", 2: "Alguicida", 3: "Clarificante" };
    const sufijo  = sufijos[bomba];

    const duracion = document.getElementById("duracionDosificacion" + sufijo).value;
    const dosiMode = document.getElementById("dosificacionMode"     + sufijo).value;

    if (!duracion || parseInt(duracion) <= 0) {
        showStatus("Ingresá una duración válida", "red");
        return;
    }

    sendCommand({ cmd: "dosificar", bomba, duracion: parseInt(duracion, 10), mode: dosiMode });

    const msg = dosiMode === "segundo"
        ? "Dosificando por " + duracion + " seg"
        : "Dosificando " + duracion + " ml";
    showStatus(msg, "green", 20);
}
