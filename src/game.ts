type EntityID = string;
type LevelID = string;

class Level {
  id: LevelID;
  element: HTMLElement;
  entities: Map<LevelID, Entity> = new Map();

  constructor(id: LevelID, e: HTMLElement) {
    this.id = id;
    this.element = e;
  }
}

class Entity {
  id: EntityID;
  element: HTMLElement;
  originX: number;
  originY: number;
  posX: number = 0;
  posY: number = 0;
  moveable: boolean;
  solid: boolean;

  constructor(id: string, e: HTMLElement) {
    this.id = id;
    this.element = e;
    this.originX = Number(e.dataset.x ?? 0);
    this.originY = Number(e.dataset.y ?? 0);
    this.moveable = e.classList.contains("moveable");
    this.solid = !e.classList.contains("nonsolid");

    e.dataset.id = id;
    e.classList.add("entity");
    if (e instanceof HTMLImageElement) {
      e.draggable = false;
    }
  }

  rect(x?: number, y?: number): Rect {
    const bcr = this.element.getBoundingClientRect();
    return new Rect(x ?? this.posX, y ?? this.posY, (x ?? this.posX) + bcr.width, (y ?? this.posY) + bcr.height);
  }

  reset() {
    this.posX = this.originX;
    this.posY = this.originY;
    this.update();
  }

  moveBy(dx: number, dy: number) {
    const newX = this.posX + dx;
    const newY = this.posY + dy;
    const newRect = this.rect(newX, newY);
    for (let m of current_level!.entities.values()) {
      if (m === this) continue;
      if (newRect.intersects(m.rect())) return false;
    }
    this.moveTo(newX, newY);
    return true;
  }

  moveTo(x: number, y: number) {
    this.posX = x;
    this.posY = y;
    this.update();
    console.log(`moved ${this.id} to ${this.rect()}`);
  }

  update() {
    this.element.style.left = `${this.posX}px`;
    this.element.style.top = `${this.posY}px`;
  }
}

class Rect {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
  ) { }

  intersects(other: Rect): boolean {
    return !(this.x1 > other.x2 || this.x2 < other.x1 || this.y1 > other.y2 || this.y2 < other.y1);
  }

  toString() {
    return `Rect(${this.x1}, ${this.y1}, ${this.x2}, ${this.y2})`;
  }
}

const gameWindow = document.querySelector(".game-window") as HTMLElement;
let levels: Map<LevelID, Level> = new Map();
let current_level: Level | null = null;

function activate_level(level_id: LevelID) {
  if (current_level != null) {
    current_level.element.style.display = "none";
  }
  current_level = null;

  const new_level = levels.get(level_id)!;
  new_level.entities.forEach((ent) => {
    ent.reset();
  });
  new_level.element.style.display = "block";
  current_level = new_level;
}

// Load levels and entities
{
  let next_entity_id = 1;
  document.querySelectorAll("section").forEach((section) => {
    const level_id = section.id.substring("level".length);
    let level = new Level(level_id, section);
    levels.set(level_id, level);

    section.querySelectorAll("*").forEach((element) => {
      let ent = new Entity(String(next_entity_id++), element as HTMLElement);
      ent.reset();
      level.entities.set(ent.id, ent);
    });
  });

  const level_number_element = document.querySelector("#levelnumber") as HTMLInputElement;
  level_number_element.addEventListener("change", (event: Event) => {
    activate_level((event.target as HTMLInputElement).value);
  });

  activate_level(level_number_element.value);
}

// Set up dragging
{
  let active: Entity | null = null;
  let offsetX: number | null = null;
  let offsetY: number | null = null;

  document.addEventListener("mousedown", (event: MouseEvent) => {
    const e = event.target as HTMLElement;
    if (e.dataset.id && current_level && current_level.entities.has(e.dataset.id)) {
      let entity = current_level.entities.get(e.dataset.id)!;
      if (!entity.moveable) return;
      active = entity;
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
      const targetX = event.pageX - offsetX!;
      const targetY = event.pageY - offsetY!;
      var dx = targetX - active.posX;
      var dy = targetY - active.posY;

      while (dx != 0 || dy != 0) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          dx = active.moveBy(Math.sign(dx), 0) ? dx - Math.sign(dx) : 0;
        } else {
          dy = active.moveBy(0, Math.sign(dy)) ? dy - Math.sign(dy) : 0;
        }
      }
    }
  });
}
