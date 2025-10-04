"use strict";
document.querySelectorAll(".moveable").forEach((element) => {
    const e = element;
    var startX = null;
    var startY = null;
    e.addEventListener("mousedown", (event) => {
        startX = event.screenX;
        startY = event.screenY;
    });
    e.addEventListener("mouseup", (_event) => {
        startX = null;
        startY = null;
    });
    e.addEventListener("mousemove", (event) => {
        if (startX != null && startY != null) {
            const x = event.screenX - startX;
            const y = event.screenY - startY;
            e.style.transform = `translate(${x}px, ${y}px)`;
        }
    });
});
var activeElement = null;
document.addEventListener("mousedown", (event) => {
    activeElement = event.target;
    console.log(`active element: ${activeElement}`);
});
