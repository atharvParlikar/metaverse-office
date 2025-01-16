export class Vector2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  copy() {
    return new Vector2(this.x, this.y);
  }

  copyRaw() {
    return { x: this.x, y: this.y };
  }
}

export type Vector2Raw = {
  x: number;
  y: number;
};
