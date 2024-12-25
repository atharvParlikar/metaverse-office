export const LEFT = "LEFT";
export const RIGHT = "RIGHT";
export const UP = "UP";
export const DOWN = "DOWN";

export class Input {
  heldDirections: string[];

  constructor() {
    this.heldDirections = [];
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW":
          this.onArrowPressed(UP);
          break;

        case "KeyS":
          this.onArrowPressed(DOWN);
          break;

        case "KeyD":
          this.onArrowPressed(RIGHT);
          break;

        case "KeyA":
          this.onArrowPressed(LEFT);
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
          this.onArrowReleased(UP);
          break;

        case "KeyS":
          this.onArrowReleased(DOWN);
          break;

        case "KeyD":
          this.onArrowReleased(RIGHT);
          break;

        case "KeyA":
          this.onArrowReleased(LEFT);
          break;
      }
    });
  }

  get direction() {
    return this.heldDirections[0]; // potentially undefined |> don't move
  }

  onArrowPressed(direction: string) {
    if (this.heldDirections.indexOf(direction) === -1) {
      this.heldDirections.unshift(direction);
    }
  }

  onArrowReleased(direction: string) {
    const index = this.heldDirections.indexOf(direction);
    if (index === -1) {
      return;
    }

    this.heldDirections.splice(index, 1);
  }
}
