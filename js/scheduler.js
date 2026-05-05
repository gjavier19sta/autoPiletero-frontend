const TABS = ["Cloro", "Alguicida", "Clarificante"];
let _configLoaded = false;

function showTab(name) {
    TABS.forEach(t => {
        document.getElementById("tab-" + t).style.display = t === name ? "block" : "none";
    });
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
        btn.classList.toggle("active", TABS[i] === name);
    });
}

function loadConfig() {
    const ok = autoConnect(
        (data) => {
            if (_configLoaded) return;
            _configLoaded = true;
            _populateForm(data);
        },
        () => sendCommand({ cmd: "get_status" }),
        () => showStatus("Sin conexión", "red", 30)
    );
    if (!ok) showStatus("Configurá la conexión MQTT primero → menú Configurar Conexión", "red", 60);
}

function _populateForm(data) {
    // ── Cloro ──
    document.getElementById("duracionDosificacionCloro").value = data.duracionDosificacionCloro || "";
    document.getElementById("dosificacionModeCloro").value     = data.dosificacionModeCloro || "mililitro";
    document.getElementById("intervalCloro").value             = data.intervalMinCloro || "";
    document.getElementById("hourCloro").value                 = data.horaCloro    != null ? data.horaCloro    : 0;
    document.getElementById("minuteCloro").value               = data.minutosCloro != null ? data.minutosCloro : 0;
    document.getElementById("modeCloro").value                 = data.schedulerModeCloro || "INTERVAL";

    // ── Alguicida ──
    document.getElementById("duracionDosificacionAlguicida").value = data.duracionDosificacionAlguicida || "";
    document.getElementById("dosificacionModeAlguicida").value     = data.dosificacionModeAlguicida || "mililitro";
    document.getElementById("intervalAlguicida").value             = data.intervalMinAlguicida || "";
    document.getElementById("hourAlguicida").value                 = data.horaAlguicida    != null ? data.horaAlguicida    : 0;
    document.getElementById("minuteAlguicida").value               = data.minutosAlguicida != null ? data.minutosAlguicida : 0;
    document.getElementById("modeAlguicida").value                 = data.schedulerModeAlguicida || "INTERVAL";

    // ── Clarificante ──
    document.getElementById("duracionDosificacionClarificante").value = data.duracionDosificacionClarificante || "";
    document.getElementById("dosificacionModeClarificante").value     = data.dosificacionModeClarificante || "mililitro";
    document.getElementById("intervalClarificante").value             = data.intervalMinClarificante || "";
    document.getElementById("hourClarificante").value                 = data.horaClarificante    != null ? data.horaClarificante    : 0;
    document.getElementById("minuteClarificante").value               = data.minutosClarificante != null ? data.minutosClarificante : 0;
    document.getElementById("modeClarificante").value                 = data.schedulerModeClarificante || "INTERVAL";

    TABS.forEach(t => { onModeChangeSuffix(t); onDosimodeChangeSuffix(t); });

    // Si viene desde pileta.html con dosis calculadas
    const params = new URLSearchParams(window.location.search);
    if (params.get("origen") === "pileta") {
        const dosiMode = params.get("dosificacionMode");
        if (params.get("duracionDosificacion")) {
            document.getElementById("duracionDosificacionCloro").value = params.get("duracionDosificacion");
            document.getElementById("dosificacionModeCloro").value     = dosiMode;
        }
        if (params.get("dosisAlguicida")) {
            document.getElementById("duracionDosificacionAlguicida").value = params.get("dosisAlguicida");
            document.getElementById("dosificacionModeAlguicida").value     = "mililitro";
        }
        if (params.get("dosisClarificante")) {
            document.getElementById("duracionDosificacionClarificante").value = params.get("dosisClarificante");
            document.getElementById("dosificacionModeClarificante").value     = "mililitro";
        }
        const banner = document.createElement("div");
        banner.style.cssText = "background:#e8f4fd;border:1px solid #90caf9;border-radius:8px;padding:10px;margin:10px;font-size:0.9em;";
        banner.innerHTML =
            "<b>Datos cargados desde Configurar Pileta:</b><br>" +
            "Cloro: " + params.get("duracionDosificacion") + " ml &nbsp;|&nbsp; " +
            "Alguicida: " + params.get("dosisAlguicida") + " ml &nbsp;|&nbsp; " +
            "Clarificante: " + params.get("dosisClarificante") + " ml<br>" +
            "<small>Cada tab tiene su dosis. Configurá el modo y guardá en cada una.</small>";
        document.body.insertBefore(banner, document.body.firstChild);
    }
}

function onModeChangeSuffix(suffix) {
    const mode = document.getElementById("mode" + suffix).value;
    document.getElementById("intervalBlock" + suffix).style.display = mode === "INTERVAL" ? "block" : "none";
    document.getElementById("timeBlock"     + suffix).style.display = mode === "TIME"     ? "block" : "none";
}

function onDosimodeChangeSuffix(suffix) {
    const flujoKey = suffix === "Alguicida"    ? "flujoBombaAlguicida"
                   : suffix === "Clarificante" ? "flujoBombaClarificante"
                   : "flujoBombaCloro";

    const modo    = document.getElementById("dosificacionMode"      + suffix).value;
    const duracion = parseFloat(document.getElementById("duracionDosificacion" + suffix).value);
    const flujo   = window.appState.status ? parseFloat(window.appState.status[flujoKey]) : NaN;
    const msgEl   = document.getElementById("dosisMsg" + suffix);

    if (isNaN(duracion) || isNaN(flujo) || flujo <= 0) { msgEl.innerText = ""; return; }

    if (modo === "mililitro") {
        const seg = (duracion / flujo) * 60;
        msgEl.innerText = seg < 60
            ? "Bomba activa por " + seg.toFixed(2) + " segundos"
            : "Bomba activa por " + (seg / 60).toFixed(2) + " minutos";
    } else {
        msgEl.innerText = "Bomba dosificará " + ((flujo / 60) * duracion).toFixed(2) + " mililitros";
    }
}

function setupInterval(suffix, bomba) {
    const boton = event.target;
    boton.disabled = true;
    boton.innerText = "Guardando...";

    const flujoKey             = suffix === "Alguicida"    ? "flujoBombaAlguicida"
                               : suffix === "Clarificante" ? "flujoBombaClarificante"
                               : "flujoBombaCloro";
    const intervalTime         = document.getElementById("interval"             + suffix).value;
    const duracionDosificacion = document.getElementById("duracionDosificacion" + suffix).value;
    const dosificacionMode     = document.getElementById("dosificacionMode"     + suffix).value;

    if (window.appState.status) {
        const tiempoNecesario = _calcularTiempoNecesario(duracionDosificacion, flujoKey);
        if (tiempoNecesario > parseFloat(intervalTime)) {
            showStatus(
                "El tiempo necesario para dosificar es " + tiempoNecesario.toFixed(2) +
                " min y es mayor que el intervalo, cambiarlos y probar de nuevo", "red"
            );
            boton.disabled = false;
            boton.innerText = "Guardar";
            return;
        }
    }

    sendCommand({
        cmd: "set_scheduler",
        bomba,
        modo: "INTERVAL",
        minutos_interval:     parseInt(intervalTime, 10),
        duracionDosificacion: parseInt(duracionDosificacion, 10),
        dosificacionMode
    });

    showStatus("Comando enviado al dispositivo", "green", 5);
    boton.disabled = false;
    boton.innerText = "Guardar";
}

function setTime(suffix, bomba) {
    const boton = event.target;
    boton.disabled = true;
    boton.innerText = "Guardando...";

    const hour                = document.getElementById("hour"               + suffix).value;
    const minute              = document.getElementById("minute"             + suffix).value;
    const duracionDosificacion = document.getElementById("duracionDosificacion" + suffix).value;
    const dosificacionMode    = document.getElementById("dosificacionMode"   + suffix).value;

    if (!_validarHoraMinuto(hour, minute)) {
        boton.disabled = false;
        boton.innerText = "Guardar";
        return;
    }

    sendCommand({
        cmd: "set_scheduler",
        bomba,
        modo: "TIME",
        hour:                 parseInt(hour,   10),
        minute:               parseInt(minute, 10),
        duracionDosificacion: parseInt(duracionDosificacion, 10),
        dosificacionMode
    });

    showStatus("Comando enviado al dispositivo", "green", 5);
    boton.disabled = false;
    boton.innerText = "Guardar";
}

function guardarTodo() {
    const boton = event.target;
    boton.disabled = true;
    boton.innerText = "Guardando...";

    const _buildCmd = (suffix, bomba) => {
        const modo = document.getElementById("mode" + suffix).value;
        const cmd  = {
            cmd: "set_scheduler",
            bomba,
            modo,
            duracionDosificacion: parseInt(document.getElementById("duracionDosificacion" + suffix).value, 10),
            dosificacionMode:     document.getElementById("dosificacionMode" + suffix).value
        };
        if (modo === "INTERVAL") {
            cmd.minutos_interval = parseInt(document.getElementById("interval" + suffix).value, 10) || 0;
        } else {
            cmd.hour   = parseInt(document.getElementById("hour"   + suffix).value, 10);
            cmd.minute = parseInt(document.getElementById("minute" + suffix).value, 10);
        }
        return cmd;
    };

    sendCommand(_buildCmd("Cloro",        1));
    sendCommand(_buildCmd("Alguicida",    2));
    sendCommand(_buildCmd("Clarificante", 3));

    showStatus("Configuración enviada al dispositivo", "green", 5);
    boton.disabled = false;
    boton.innerText = "Guardar Todo";
}

function _calcularTiempoNecesario(ml, flujoKey = "flujoBomba") {
    return parseFloat(ml) / parseFloat(window.appState.status[flujoKey]);
}

function _validarHoraMinuto(hour, minute) {
    const h = parseInt(hour,   10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m))       { showStatus("Hora o minutos inválidos", "red"); return false; }
    if (h < 0 || h > 23)            { showStatus("La hora debe estar entre 0 y 23", "red"); return false; }
    if (m < 0 || m > 59)            { showStatus("Los minutos deben estar entre 0 y 59", "red"); return false; }
    if (hour === "" || minute === "") { showStatus("Hora y minutos son obligatorios", "red"); return false; }
    return true;
}
