"use strict";
var activeElement = null;
var startX = null;
var startY = null;
document.addEventListener("mousedown", (event) => {
    const e = event.target;
    if (e.classList.contains("moveable")) {
        activeElement = event.target;
        startX = event.screenX - Number(activeElement.dataset.offsetX ?? 0);
        startY = event.screenY - Number(activeElement.dataset.offsetY ?? 0);
    }
    console.log(`activeElement: ${activeElement}`);
});
document.addEventListener("mouseup", (_event) => {
    activeElement = null;
    startX = null;
    startY = null;
    console.log(`activeElement: ${activeElement}`);
});
document.addEventListener("mousemove", (event) => {
    if (activeElement != null) {
        const x = event.screenX - startX;
        const y = event.screenY - startY;
        activeElement.dataset.offsetX = String(x);
        activeElement.dataset.offsetY = String(y);
        activeElement.style.transform = `translate(${x}px, ${y}px)`;
    }
});
