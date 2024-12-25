/* eslint-disable @typescript-eslint/no-unused-vars */
import { Input } from "./Input";
import { Vector2 } from "./Vector2";

export class GameObject {
  position: Vector2;
  children: GameObject[];
  drawOffset: Vector2;
  input: Input | null;

  constructor({
    position,
    drawOffset,
    input,
  }: {
    position?: Vector2;
    drawOffset?: Vector2;
    input?: Input;
  }) {
    this.position = position ?? new Vector2();
    this.children = [];
    this.drawOffset = drawOffset ?? new Vector2();
    this.input = input ?? null;
  }

  stepEntry(delta: number, root: GameObject) {
    this.children.forEach((child) => child.stepEntry(delta, root));

    this.step(delta, root);
  }

  step(delta: number, root: GameObject) {}

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const drawPosX = x + this.position.x + this.drawOffset.x;
    const drawPosY = y + this.position.y + this.drawOffset.y;

    // Rendering the images
    this.drawImage(ctx, drawPosX, drawPosY);

    // Pass on to the children
    this.children.forEach((child) => child.draw(ctx, drawPosX, drawPosY));
  }

  drawImage(ctx: CanvasRenderingContext2D, drawPosX: number, drawPosY: number) {
    return;
  }

  addChild(gameObject: GameObject) {
    this.children.push(gameObject);
  }

  removeChild(gameObject: GameObject) {
    this.children = this.children.filter((c) => gameObject !== c);
  }
}
