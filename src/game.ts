class Moveable {
  id: string;
  element: HTMLElement;
  originX: number;
  originY: number;
  posX: number = 0;
  posY: number = 0;

  constructor(id: string, e: HTMLElement) {
    this.id = id;
    e.dataset.id = id;
    this.element = e;
    this.originX = Number(e.dataset.x ?? 0);
    this.originY = Number(e.dataset.y ?? 0);
    this.reset();
  }

  reset() {
    this.posX = this.originX;
    this.posY = this.originY;
    this.update();
  }

  moveTo(x: number, y: number) {
    this.posX = x;
    this.posY = y;
    this.update();
  }

  update() {
    this.element.style.left = `${this.posX}px`;
    this.element.style.top = `${this.posY}px`;
  }
}

const gameWindow = document.querySelector(".game-window") as HTMLElement;
let moveables: { [id: string]: Moveable } = {};

{
  let next_id = 1;
  document.querySelectorAll(".moveable").forEach((element) => {
    let m = new Moveable(String(next_id++), element as HTMLElement);
    m.reset();
    moveables[m.id] = m;
  });
}

{
  let active: Moveable | null = null;
  let offsetX: number | null = null;
  let offsetY: number | null = null;

  document.addEventListener("mousedown", (event: MouseEvent) => {
    const e = event.target as HTMLElement;
    if (e.dataset.id && e.dataset.id in moveables) {
      active = moveables[e.dataset.id];
      offsetX = event.pageX - active.posX;
      offsetY = event.pageY - active.posY;
      console.log(`active=${active.id} offsetX=${offsetX} offsetY=${offsetY}`);
    }
  });

  document.addEventListener("mouseup", (_event: MouseEvent) => {
    active = null;
    offsetX = null;
    offsetY = null;
  });

  document.addEventListener("mousemove", (event: MouseEvent) => {
    if (active != null) {
      active.moveTo(event.pageX - offsetX!, event.pageY - offsetY!);
    }
  });
}
