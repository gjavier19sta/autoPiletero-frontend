let FLUJO_ML_POR_MIN = 0;
let _piletaFormReady = false;

const DOSIS_CLORO_ML_POR_1000L        = 20;
const DOSIS_ALGUICIDA_ML_POR_1000L    = 10;
const DOSIS_CLARIFICANTE_ML_POR_1000L = 5;

let _dosisActual = null;
let _litrosActual = 0;

function onModoMedicionChange() {
    const modo = document.getElementById("modoMedicion").value;
    document.getElementById("bloqueListros").style.display     = (modo === "litros")      ? "block" : "none";
    document.getElementById("bloqueDimensiones").style.display = (modo === "dimensiones") ? "block" : "none";
    document.getElementById("cardDosis").style.display = "none";
    document.getElementById("btnGuardar").disabled = true;
    _dosisActual = null;
}

function getLitros() {
    const modo = document.getElementById("modoMedicion").value;
    if (modo === "litros") {
        return parseFloat(document.getElementById("litros").value) || 0;
    } else {
        const largo       = parseFloat(document.getElementById("largo").value)       || 0;
        const ancho       = parseFloat(document.getElementById("ancho").value)       || 0;
        const profundidad = parseFloat(document.getElementById("profundidad").value) || 0;
        const litros = largo * ancho * profundidad * 1000;
        if (litros > 0) {
            document.getElementById("litrosCalculados").innerText = "Volumen: " + litros.toLocaleString() + " litros";
        }
        return litros;
    }
}

function mlATiempo(ml) {
    const ms = (ml / FLUJO_ML_POR_MIN) * 60 * 1000;
    if (ms < 1000)  return Math.round(ms) + " ms";
    if (ms < 60000) return (ms / 1000).toFixed(1) + " seg";
    return (ms / 60000).toFixed(1) + " min";
}

function calcularDosis(litros) {
    return {
        cloro:        Math.round((litros / 1000) * DOSIS_CLORO_ML_POR_1000L),
        alguicida:    Math.round((litros / 1000) * DOSIS_ALGUICIDA_ML_POR_1000L),
        clarificante: Math.round((litros / 1000) * DOSIS_CLARIFICANTE_ML_POR_1000L)
    };
}

function mostrarDosis(dosis) {
    document.getElementById("dosisCloro").innerText        = dosis.cloro        + " ml";
    document.getElementById("dosisAlguicida").innerText    = dosis.alguicida    + " ml";
    document.getElementById("dosisClarificante").innerText = dosis.clarificante + " ml";
    document.getElementById("tiempoCloro").innerText        = mlATiempo(dosis.cloro);
    document.getElementById("tiempoAlguicida").innerText    = mlATiempo(dosis.alguicida);
    document.getElementById("tiempoClarificante").innerText = mlATiempo(dosis.clarificante);
    document.getElementById("cardDosis").style.display = "block";
}

function calcular() {
    const statusMsg = document.getElementById("statusMsg");
    statusMsg.innerText = "";
    document.getElementById("btnGuardar").disabled = true;
    _dosisActual = null;

    if (!FLUJO_ML_POR_MIN || FLUJO_ML_POR_MIN <= 0) {
        statusMsg.innerText = "Esperando estado del dispositivo...";
        return;
    }

    const litros = getLitros();
    if (!litros || litros <= 0) {
        statusMsg.innerText = "Ingresá un volumen válido.";
        return;
    }

    _litrosActual = litros;
    _dosisActual  = calcularDosis(litros);
    mostrarDosis(_dosisActual);
    document.getElementById("btnGuardar").disabled = false;
    statusMsg.innerText = "Dosis calculada. Revisá los valores y guardá desde el Scheduler.";
}

function irAlScheduler() {
    if (!_dosisActual) return;

    const dosificacionMode = window.appState.status ? window.appState.status.dosificacionMode : "mililitro";

    const params = new URLSearchParams({
        litros:               _litrosActual,
        dosisCloro:           _dosisActual.cloro,
        dosisAlguicida:       _dosisActual.alguicida,
        dosisClarificante:    _dosisActual.clarificante,
        duracionDosificacion: _dosisActual.cloro,
        dosificacionMode,
        origen:               "pileta"
    });

    window.location.href = "scheduler.html?" + params.toString();
}

function loadPiletaConfig() {
    const ok = autoConnect(
        (data) => {
            FLUJO_ML_POR_MIN = parseFloat(data.flujoBomba) || 0;

            if (_piletaFormReady) return;
            _piletaFormReady = true;

            if (data.piletaLitros && data.piletaLitros > 0) {
                document.getElementById("litros").value = data.piletaLitros;
                _litrosActual = data.piletaLitros;
                _dosisActual  = calcularDosis(data.piletaLitros);
                mostrarDosis(_dosisActual);
                document.getElementById("btnGuardar").disabled = false;
            }
        },
        null,
        () => showStatus("Sin conexión", "red", 30)
    );
    if (!ok) showStatus("Configurá la conexión MQTT primero → menú Configurar Conexión", "red", 60);
}
