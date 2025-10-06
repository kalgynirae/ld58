enum GameState {
  ClickToStart,
  TitleScreen,
  Level1,
  Level2,
  Level2Fire,
  Level2Exploded,
  NeutralEnding,
  TrueEnding,
};
// @ts-ignore
let gameState: GameState = null;
const gameStateDebugElement = document.querySelector("#gamestate") as HTMLElement;
const validTransitions: Map<GameState | null, GameState[]> = new Map();
validTransitions.set(null, [GameState.ClickToStart]);
validTransitions.set(GameState.ClickToStart, [GameState.TitleScreen]);
validTransitions.set(GameState.TitleScreen, [GameState.Level1]);
validTransitions.set(GameState.Level1, [GameState.Level2]);
validTransitions.set(GameState.Level2, [GameState.NeutralEnding, GameState.Level2Fire]);
validTransitions.set(GameState.Level2Fire, [GameState.NeutralEnding, GameState.Level2Exploded, GameState.Level2]);
validTransitions.set(GameState.Level2Exploded, [GameState.TrueEnding]);
validTransitions.set(GameState.NeutralEnding, [GameState.Level2]);
validTransitions.set(GameState.TrueEnding, [GameState.TitleScreen]);

function setGameState(newState: GameState) {
  if ((validTransitions.get(gameState) ?? []).indexOf(newState) >= 0) {
      gameState = newState;
      gameStateDebugElement.textContent = GameState[gameState] ?? "OHONO";
  } else {
    throw new Error(`gameState cannot change to ${GameState[newState]} from ${GameState[gameState]}`);
  }
}
setGameState(GameState.ClickToStart);

function draggingAllowed(): boolean {
  switch (gameState) {
    case GameState.TitleScreen:
    case GameState.Level1:
    case GameState.Level2:
    case GameState.Level2Fire:
    case GameState.Level2Exploded:
      return true;
    default:
      return false;
  }
}

function advanceLevel() {
  switch (gameState) {
    case GameState.TitleScreen:
      setGameState(GameState.Level1);
      activateLevel("level1");
      break;
    case GameState.Level1:
      setGameState(GameState.Level2);
      activateLevel("level2");
      break;
    case GameState.Level2:
    case GameState.Level2Fire:
      setGameState(GameState.NeutralEnding);
      activateLevel("levelNeutralEnding");
      break;
    case GameState.Level2Exploded:
      setGameState(GameState.TrueEnding);
      activateLevel("levelTrueEnding");
      break;
    case GameState.NeutralEnding:
      setGameState(GameState.Level2);
      activateLevel("level2");
    case GameState.TrueEnding:
      updateCollectedCount(0);
      title_trash_entity?.reset();
      setGameState(GameState.TitleScreen);
      activateLevel("levelTitle");
    default:
      console.log(`advanceLevel() called while gameState is ${GameState[gameState]}`);
      break;
  }
}

type EntityID = string;
type LevelID = string;

class Level {
  id: LevelID;
  element: HTMLElement;
  entities: Map<EntityID, Entity> = new Map();

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
  offsetX: number = 0;
  offsetY: number = 0;
  moveable: boolean;
  target: boolean;
  solid: boolean;

  constructor(id: string, e: HTMLElement) {
    this.id = id;
    this.element = e;
    this.originX = Number(e.dataset.x ?? 0);
    this.originY = Number(e.dataset.y ?? 0);
    this.moveable = e.classList.contains("moveable");
    this.target = e.classList.contains("target");
    this.solid = !e.classList.contains("nonsolid") && !this.target;

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
    this.element.classList.remove("glide");
    this.posX = this.originX;
    this.posY = this.originY;
    this.update();

    if (this.moveable) {
      this.element.style.visibility = "visible";
      this.element.style.display = "";
    }
  }

  moveBy(dx: number, dy: number) {
    const newX = this.posX + dx;
    const newY = this.posY + dy;
    const newRect = this.rect(newX, newY);
    for (let m of current_entities.values()) {
      if (m === this) continue;
      if (!m.solid) continue;
      if (newRect.intersects(m.rect())) return false;
    }
    this.moveTo(newX, newY);
    return true;
  }

  moveTo(x: number, y: number) {
    this.posX = x;
    this.posY = y;
    this.update();
    // console.log(`moved ${this.id} to ${this.rect()}`);
  }

  update() {
    this.element.style.left = `${this.posX + this.offsetX}px`;
    this.element.style.top = `${this.posY + this.offsetY}px`;
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

  middlePointIntersects(other: Rect): boolean {
    const middleX = (this.x1 + this.x2) / 2;
    const middleY = (this.y1 + this.y2) / 2;
    return !(middleX > other.x2 || middleX < other.x1 || middleY > other.y2 || middleY < other.y1);
  }

  toString() {
    return `Rect(${this.x1}, ${this.y1}, ${this.x2}, ${this.y2})`;
  }
}

const gameWindow = document.querySelector(".game-window") as HTMLElement;
const gameWindowX = gameWindow.getBoundingClientRect().x;
const gameWindowY = gameWindow.getBoundingClientRect().y;
const fireElement = document.querySelector(".fire") as HTMLElement;
let persistent_entities: Map<EntityID, Entity> = new Map();
let levels: Map<LevelID, Level> = new Map();
let currentLevel: Level | null = null;
let current_entities: Map<EntityID, Entity> = new Map();
let target: Entity | null = null;
let title_trash_entity: Entity | null = null;
let collectedCount: number = 0;
// account for bonus moveable object
let totalCount: number = 1;
const levelBackgrounds: Record<string, string> = {
  "levelTitle": "title-screen",
  "level1": "house-level",
  "level2": "river-level",
};

function activateLevel(level_id: LevelID) {
  let prevLevel = null;
  if (currentLevel != null) {
    currentLevel.element.style.display = "none";
    prevLevel = currentLevel.id;
  }
  currentLevel = null;
  current_entities = new Map(persistent_entities);

  const newLevel = levels.get(level_id)!;
  newLevel.entities.forEach((ent) => {
    ent.reset();
    current_entities.set(ent.id, ent);
  });
  newLevel.element.style.display = "block";
  currentLevel = newLevel;

  gameWindow.classList.add(levelBackgrounds[newLevel.id]);
  if (prevLevel != null) {
    gameWindow.classList.remove(levelBackgrounds[prevLevel]);
  }
}

// Load levels and entities
{
  let next_entity_id = 1;

  // Persistent entities
  document.querySelectorAll(".persistent").forEach((persistent) => {
    persistent.querySelectorAll("*").forEach((element) => {
      let ent = new Entity(String(next_entity_id++), element as HTMLElement);
      ent.reset();
      persistent_entities.set(ent.id, ent);

      if (ent.target) {
        target = ent;
      }
    });
  });

  // Title "Trash"
  const tt_element = document.querySelector("#title-trash") as HTMLElement;
  title_trash_entity = new Entity(String(next_entity_id++), tt_element);
  const game_window_rect = (document.querySelector(".game-window") as HTMLElement).getBoundingClientRect();
  const tt_rect = title_trash_entity.element.getBoundingClientRect();
  console.log(game_window_rect);
  console.log(tt_rect);
  title_trash_entity.offsetX = game_window_rect.left - tt_rect.left;
  title_trash_entity.offsetY = game_window_rect.top - tt_rect.top;
  title_trash_entity.originX = -title_trash_entity.offsetX;
  title_trash_entity.originY = -title_trash_entity.offsetY;
  title_trash_entity.reset();
  persistent_entities.set(title_trash_entity.id, title_trash_entity);

  // Levels (and level entities)
  document.querySelectorAll("section").forEach((section) => {
    const level_id = section.id;
    let level = new Level(level_id, section);
    levels.set(level_id, level);

    section.querySelectorAll("*").forEach((element) => {
      let ent = new Entity(String(next_entity_id++), element as HTMLElement);
      ent.reset();
      level.entities.set(ent.id, ent);
      if (ent.moveable && level_id !== "0") {
        totalCount += 1;
      }
    });
  });

  const totalCountElement = document.querySelector("#totalCount") as HTMLElement;
  totalCountElement.textContent = String(totalCount);

  const nextLevelElement = document.querySelector("#nextlevel") as HTMLButtonElement;
  nextLevelElement.addEventListener("click", (_event: Event) => {
    advanceLevel();
  });

  activateLevel("levelTitle");

  const showWallsElement = document.querySelector("#showWalls") as HTMLInputElement;
  showWallsElement.addEventListener("change", (_event: Event) => {
    const visibility = showWallsElement.checked ? "visible" : "hidden";
    document.querySelectorAll(".wall").forEach((element) => {
      (element as HTMLElement).style.visibility = visibility;
    });
  });

  const showTargetElement = document.querySelector("#showTarget") as HTMLInputElement;
  showTargetElement.addEventListener("change", (_event: Event) => {
    const visibility = showTargetElement.checked ? "visible" : "hidden";
    document.querySelectorAll(".target").forEach((element) => {
      (element as HTMLElement).style.visibility = visibility;
    });
  });
}

// Set up dragging
{
  let active: Entity | null = null;
  let offsetX: number | null = null;
  let offsetY: number | null = null;

  document.addEventListener("mousedown", (event: MouseEvent) => {
    if (!draggingAllowed()) return;
    const e = event.target as HTMLElement;
    if (e.dataset.id && current_entities.has(e.dataset.id)) {
      let entity = current_entities.get(e.dataset.id)!;
      if (!entity.moveable) return;
      active = entity;
      offsetX = event.pageX - active.posX;
      offsetY = event.pageY - active.posY;
      playSound(yoink!);
      // console.log(`active=${active.id} offsetX=${offsetX} offsetY=${offsetY}`);
      // for (let m of moveables.values()) {
      //   console.log(`id=${m.id}  rect=${m.rect()}`);
      // }
    }
  });

  document.addEventListener("mouseup", (event: MouseEvent) => {
    let removedAnEntity = false;
    if (active != null) {
      if (active.rect().middlePointIntersects(target!.rect())) {
        active.element.classList.add("glide");
        active.element.style.top = "460px";
        const newLeft = 655 - (active.element.getBoundingClientRect().width / 2);
        active.element.style.left = `${newLeft}px`;
        let a = active;
        setTimeout(() => {
          if (a.element.id === "title-trash") {
            a.element.style.visibility = "hidden";
          } else {
            a.element.style.display = "none";
          }
        }, 100);

        current_entities.delete(active.id);
        removedAnEntity = true;
        updateCollectedCount(collectedCount + 1);

        if (active.element.id === "cigarette") {
          activateFire();
          setGameState(GameState.Level2Fire);
          setTimeout(deactivateFire, 2500);
        }

        if (active.element.id === "bomb" && gameState === GameState.Level2Fire) {
          activateExplosion();
          setGameState(GameState.Level2Exploded);
          setTimeout(deactivateExplosion, 1500);
        }
      }
      if (active.element.id === "start-button" && Math.abs(active.posX - active.originX) < 10 && Math.abs(active.posY - active.originY) < 10) {
        active.element.classList.add("glide");
        active.moveTo(active.posX, 599 - active.element.getBoundingClientRect().height);
        let a = active;
        setTimeout(() => {
          a.element.classList.remove("glide");
        }, 200);
      }
      playSound(removedAnEntity ? collect! : drop!);
    }

    active = null;
    offsetX = null;
    offsetY = null;

    if (removedAnEntity) {
      for (let m of current_entities.values()) {
        if (m.moveable && m.element.id !== "title-trash" && gameState !== GameState.Level2Exploded) {
          return;
        }
      }
      setTimeout(advanceLevel, 400);
    }
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

    const posXElement = document.querySelector("#posX") as HTMLElement;
    const posYElement = document.querySelector("#posY") as HTMLElement;
    posXElement.textContent = String(event.pageX - gameWindowX);
    posYElement.textContent = String(event.pageY - gameWindowY);
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault();
      const debugElement = document.querySelector("#debug") as HTMLElement;
      if (getComputedStyle(debugElement).visibility === "hidden") {
        debugElement.style.visibility = "visible";
      } else {
        debugElement.style.visibility = "hidden";
      }
    }
  });
}

// State transitions
const clickToStart = document.querySelector(".click-to-start") as HTMLElement;
clickToStart.addEventListener("click", async (e) => {
  await audioLoading;
  initAudio();
  startMusic();
  clickToStart.style.display = "none";
  setGameState(GameState.TitleScreen);
});

function activateFire() {
  const fireElement = document.querySelector("#fire") as HTMLElement;
  fireElement.style.visibility = "visible";
}

function deactivateFire() {
  const fireElement = document.querySelector("#fire") as HTMLElement;
  fireElement.style.visibility = "hidden";
  if (gameState === GameState.Level2Fire) {
    setGameState(GameState.Level2);
  }
}

function activateExplosion() {
  const fireElement = document.querySelector("#explosion") as HTMLElement;
  fireElement.style.visibility = "visible";
}

function deactivateExplosion() {
  const fireElement = document.querySelector("#explosion") as HTMLElement;
  fireElement.style.visibility = "hidden";
  activateSurpriseWall();
}

function activateSurpriseWall() {
  const fireElement = document.querySelector("#spillage") as HTMLElement;
  fireElement.style.visibility = "visible";

  const surpriseWallElement = document.querySelector("#surprise-wall") as HTMLElement;
  surpriseWallElement.style.height = "300px";
}

function updateCollectedCount(newCount: number) {
  collectedCount = newCount;
  const collectedCountElement = document.querySelector("#collectedCount") as HTMLElement;
  collectedCountElement.textContent = String(collectedCount);
}
