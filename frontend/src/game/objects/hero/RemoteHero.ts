import { Animations } from "../../Animations";
import { FrameIndexPattern } from "../../frameIndexPattern";
import { GameObject } from "../../GameObject";
import { moveTowards } from "../../helpers/moveTowards";
import { DOWN, LEFT, RIGHT, UP } from "../../Input";
import { resources } from "../../Resource";
import { Sprite } from "../../Sprite";
import { Vector2 } from "../../Vector2";
import {
  STAND_DOWN,
  STAND_LEFT,
  STAND_RIGHT,
  STAND_UP,
  WALK_DOWN,
  WALK_LEFT,
  WALK_RIGHT,
  WALK_UP,
} from "./heroAnimations";

export class RemoteHero extends GameObject {
  facingDirection: string;
  destinationPosition: Vector2;
  body: Sprite;
  shadow: Sprite;

  constructor(x: number, y: number) {
    super({
      position: new Vector2(x, y),
    });

    this.shadow = new Sprite({
      resource: resources.images.shadow,
      frameSize: new Vector2(32, 32),
      position: new Vector2(-8, -19),
    });

    this.addChild(this.shadow);

    this.facingDirection = DOWN;

    this.body = new Sprite({
      resource: resources.images.hero,
      frameSize: new Vector2(32, 32),
      hFrames: 3,
      vFrames: 8,
      frame: 1,
      position: new Vector2(-8, -20),
      animations: new Animations({
        standDown: new FrameIndexPattern(STAND_DOWN),
        standUp: new FrameIndexPattern(STAND_UP),
        standLeft: new FrameIndexPattern(STAND_LEFT),
        standRight: new FrameIndexPattern(STAND_RIGHT),

        walkDown: new FrameIndexPattern(WALK_DOWN),
        walkUp: new FrameIndexPattern(WALK_UP),
        walkLeft: new FrameIndexPattern(WALK_LEFT),
        walkRight: new FrameIndexPattern(WALK_RIGHT),
      }),
    });

    this.addChild(this.body);

    this.destinationPosition = this.position.copy();
  }

  step() {
    moveTowards(this, this.destinationPosition, 1.5);

    // const hasArrived = distance <= 1;

    // console.log("distance: ", distance, hasArrived);

    // if (!hasArrived) {
    //   this.tryMove();
    // }
  }

  // TODO: Fix animations for remote hero
  tryMove() {
    let input = undefined; // potentially undefined |> don't move, standing animations

    const x = this.position.x;
    const dx = this.destinationPosition.x;
    const y = this.position.y;
    const dy = this.destinationPosition.y;

    if (Math.floor(x - dx) < 0) {
      input = RIGHT;
    } else if (Math.floor(x - dx) > 0) {
      input = LEFT;
    } else if (Math.floor(y - dy) < 0) {
      input = DOWN;
    } else if (Math.floor(y - dy) > 0) {
      input = UP;
    } else {
      input = undefined;
    }

    console.log("Input: ", input);

    if (!input) {
      if (this.facingDirection === DOWN)
        this.body.animations?.play("standDown");
      if (this.facingDirection === UP) this.body.animations?.play("standUp");
      if (this.facingDirection === LEFT)
        this.body.animations?.play("standLeft");
      if (this.facingDirection === RIGHT)
        this.body.animations?.play("standRight");
      return;
    }

    // for movement
    if (input === DOWN) {
      this.body.animations?.play("walkDown");
      this.body.frame = 0;
    }

    if (input === UP) {
      this.body.animations?.play("walkUp");
      this.body.frame = 6;
    }

    if (input === RIGHT) {
      console.log("Playing walkRight");
      this.body.animations?.play("walkRight");
      this.body.frame = 3;
    }

    if (input === LEFT) {
      this.body.animations?.play("walkLeft");
      this.body.frame = 9;
    }
  }
}
