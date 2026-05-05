async function wifiInfo() {
    const response = await fetch("/status");
    const data = await response.json();

    document.getElementById("horaDelDia").innerText = data.horaDelDia;


 //////modo debug   
    console.log ("contenido en data\n");
    console.log(data);

    // console.log ("contenido en modo\n");
    // console.log(data.schedulerMode);

    // console.log("STATUS:", response.status);
    // console.log("ok?:", response.ok);
    // console.log("HEADERS:", response.headers.get("content-type"));
    
}

async function saveWifi() {
    let ssid = document.getElementById("ssid").value
    let pass = document.getElementById("password").value

    let saveWifiStatus = await fetch(
        "/wifi/config",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ssid: ssid,
                password: pass
            })
        }
    )
    let texto = await saveWifiStatus.text();

    if (saveWifiStatus.ok){
//        alert("Wifi guardada");
        timedMessage("Configurando WiFi... redirigiendo en ", "blue", 5);

        setTimeout(() => {
            window.location.href = "http://autoPiletero.local/index.html";
        }, 10000);
    }else{
        alert(texto);
    }  
}

function timedMessage(message, color = "green", duracionSeg = 5){

    const element = document.getElementById("statusMsg");
    element.style.color = color;
    let time = duracionSeg;

    element.innerText = `${message} (${time})`;

    const interval = setInterval(() => {

        time--;

        if(time > 0){
            element.innerText = `${message} (${time})`;
        } else {
            clearInterval(interval);
            element.innerText = "";
        }

    }, 1000);
}

async function loadNetworks() {

    let r = await fetch("/wifi/scan")
    let nets = await r.json()
   
    const table = document.createElement("table");

    table.classList.add("tablaWifi");
    // encabezado
    const header = table.insertRow();
    header.innerHTML = "<th>SSID</th><th>RSSI</th>";

    nets.forEach(n => {
        const row = table.insertRow();

        row.onclick = () => selectSSID(n.ssid);

        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);

        cell1.textContent = n.ssid;
        cell2.textContent = n.rssi;
    });

    // ahora sí lo insertás
    const container = document.getElementById("networks");
    container.innerHTML = ""; // limpiar
    container.appendChild(table);

}

function selectSSID(ssid){
    document.getElementById("ssid").value = ssid
}

function signalLevel(rssi){
    if(rssi > -50) return "📶📶📶"
    if(rssi > -70) return "📶📶"
    return "📶"
}