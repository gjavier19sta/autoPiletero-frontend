const FW_FRONTEND_VERSION = "3.0.0";

document.addEventListener("DOMContentLoaded", function () {
    const footer = document.createElement("div");
    footer.id = "footer-version";
    footer.style.cssText = "margin-top:30px; font-size:0.75em; color:#aaa; text-align:center; padding-bottom:10px;";
    footer.innerText = `Frontend v${FW_FRONTEND_VERSION}`;
    document.body.appendChild(footer);
});