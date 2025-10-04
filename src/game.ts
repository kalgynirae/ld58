class Rect {
  constructor(public x1: number, public y1: number, public x2: number, public y2: number) { }

  intersects(other: Rect): boolean {
    return !(this.x1 > other.x2 || this.x2 < other.x1 || this.y1 > other.y2 || this.y2 < other.y1);
  }

  toString() {
    return `Rect(${this.x1}, ${this.x2}, ${this.y1}, ${this.y2})`;
  }
}

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

  rect(): Rect {
    return new Rect(this.posX, this.posY, this.posX + this.element.offsetWidth, this.posY + this.element.offsetHeight);
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
let moveables: Map<string, Moveable> = new Map();

{
  let next_id = 1;
  document.querySelectorAll(".moveable").forEach((element) => {
    let m = new Moveable(String(next_id++), element as HTMLElement);
    m.reset();
    moveables.set(m.id, m);
  });
}

{
  let active: Moveable | null = null;
  let offsetX: number | null = null;
  let offsetY: number | null = null;

  document.addEventListener("mousedown", (event: MouseEvent) => {
    const e = event.target as HTMLElement;
    if (e.dataset.id && moveables.has(e.dataset.id)) {
      active = moveables.get(e.dataset.id)!;
      offsetX = event.pageX - active.posX;
      offsetY = event.pageY - active.posY;
      // console.log(`active=${active.id} offsetX=${offsetX} offsetY=${offsetY}`);
      // for (let m of moveables.values()) {
      //   console.log(`id=${m.id}  rect=${m.rect()}`);
      // }
    }
  });

  document.addEventListener("mouseup", (_event: MouseEvent) => {
    active = null;
    offsetX = null;
    offsetY = null;
  });

  document.addEventListener("mousemove", (event: MouseEvent) => {
    if (active != null) {
      let x = event.pageX - offsetX!;
      let y = event.pageY - offsetY!;
      for (let m of moveables.values()) {
        if (m === active) continue;
        if (m.rect().intersects(active.rect())) {
          console.log(`intersects with ${m.id}`);
          // TODO: prevent movement into intersecting position
        }
      }
      active.moveTo(x, y);
    }
  });
}
