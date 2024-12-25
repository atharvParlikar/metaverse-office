import { events } from "./Events";
import { GameObject } from "./GameObject";
import { Vector2 } from "./Vector2";

export class Camera extends GameObject {
  constructor() {
    super({});

    events.on("HERO_POSITION", this, (heroPosition: Vector2) => {
      const personHalf = 8;
      const canvasWidth = 320;
      const canvasHeight = 180;
      const halfWidth = -personHalf + canvasWidth / 2;
      const halfHeight = -personHalf + canvasHeight / 2;

      this.position = new Vector2(
        -heroPosition.x + halfWidth,
        -heroPosition.y + halfHeight,
      );
    });

    // you stupid shit this is not how it works
    // events.on("HERO_NEXT_POSITION", this, (heroPosition: Vector2) => {
    //   console.log("remote peer position: ", heroPosition);
    // });
  }
}
