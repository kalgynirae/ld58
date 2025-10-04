var activeElement: HTMLElement | null = null;
var startX: number | null = null;
var startY: number | null = null;

document.addEventListener("mousedown", (event: MouseEvent) => {
  const e = event.target as HTMLElement;
  if (e.classList.contains("moveable")) {
    activeElement = event.target as HTMLElement;
    startX = event.screenX - Number(activeElement.dataset.offsetX ?? 0);
    startY = event.screenY - Number(activeElement.dataset.offsetY ?? 0);
  }
  console.log(`activeElement: ${activeElement}`);
});

document.addEventListener("mouseup", (_event: MouseEvent) => {
  activeElement = null;
  startX = null;
  startY = null;
  console.log(`activeElement: ${activeElement}`);
});

document.addEventListener("mousemove", (event: MouseEvent) => {
  if (activeElement != null) {
    const x = event.screenX - startX!;
    const y = event.screenY - startY!;
    activeElement.dataset.offsetX = String(x);
    activeElement.dataset.offsetY = String(y);
    activeElement.style.transform = `translate(${x}px, ${y}px)`;
  }
});
