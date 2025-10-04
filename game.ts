document.querySelectorAll(".moveable").forEach((element) => {
  const e = element as HTMLElement;
  var startX: number | null = null;
  var startY: number | null = null;
  e.addEventListener("mousedown", (event: MouseEvent) => {
    startX = event.screenX;
    startY = event.screenY;
  });
  e.addEventListener("mouseup", (_event: MouseEvent) => {
    startX = null;
    startY = null;
  });
  e.addEventListener("mousemove", (event: MouseEvent) => {
    if (startX != null && startY != null) {
      const x = event.screenX - startX;
      const y = event.screenY - startY;
      e.style.transform = `translate(${x}px, ${y}px)`;
    }
  });
});
var activeElement: HTMLElement | null = null;
document.addEventListener("mousedown", (event) => {
  const e = event.target as HTMLElement;
  if (e.classList.contains("moveable")) {
    activeElement = event.target as HTMLElement;
  }
  console.log(`active element: ${activeElement}`);
});
