import { getSocket } from "../../../util/socketChannel";
import { Animations } from "../../Animations";
import { events } from "../../Events";
import { FrameIndexPattern } from "../../frameIndexPattern";
import { GameObject } from "../../GameObject";
import { isSpaceFree } from "../../helpers/grid";
import { moveTowards } from "../../helpers/moveTowards";
import { DOWN, UP, LEFT, RIGHT } from "../../Input";
import { walls } from "../../levels/level1";
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

import { useStore } from "../../../util/store";

export class Hero extends GameObject {
  facingDirection: string;
  destinationPosition: Vector2;
  body: Sprite;
  shadow: Sprite;
  id: number | null;

  // for emitting position events
  lastX: number;
  lastY: number;

  lastSocketX: number;
  lastSocketY: number;

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
        walkDown: new FrameIndexPattern(WALK_DOWN),
        walkUp: new FrameIndexPattern(WALK_UP),
        walkLeft: new FrameIndexPattern(WALK_LEFT),
        walkRight: new FrameIndexPattern(WALK_RIGHT),

        standDown: new FrameIndexPattern(STAND_DOWN),
        standUp: new FrameIndexPattern(STAND_UP),
        standLeft: new FrameIndexPattern(STAND_LEFT),
        standRight: new FrameIndexPattern(STAND_RIGHT),
      }),
    });

    this.destinationPosition = this.position.copy();

    this.addChild(this.body);

    this.lastX = 0;
    this.lastY = 0;

    this.lastSocketX = 0;
    this.lastSocketY = 0;

    this.id = null;

    events.on("set-hero-id", this, (id: number) => {
      this.id = id;
      console.log("Hero id set successfully");
    });

    events.on("set-position", this, (position: Vector2) => {
      this.position = position;
      this.destinationPosition = this.position.copy();
    });
  }

  step(delta: number, root: GameObject) {
    const distance = moveTowards(this, this.destinationPosition, 1.5);
    const hasArrived = distance <= 1;
    if (hasArrived) {
      this.tryMove(root);
    }

    this.tryEmitPosition();

    useStore.getState().remotePlayers.forEach((player) => {
      const distance = Math.sqrt(
        (player.position.x - this.position.x) ** 2 +
          (player.position.y - this.position.y) ** 2,
      );
      if (distance <= 32) {
        useStore.getState().setCanCall(true);
        useStore.getState().setToCall(player);
      } else {
        useStore.getState().setCanCall(false);
        useStore.getState().setToCall(null);
      }
    });
  }

  tryEmitPosition() {
    if (this.lastX === this.position.x && this.lastY === this.position.y)
      return;

    this.lastX = this.position.x;
    this.lastY = this.position.y;

    events.emit("HERO_POSITION", this.position);
  }

  tryEmitNextPosition(position: { x: number; y: number }) {
    if (
      this.lastSocketX === this.position.x &&
      this.lastSocketY === this.position.y
    )
      return;

    this.lastSocketX = this.position.x;
    this.lastSocketY = this.position.y;

    const socket = getSocket();

    if (!socket) return;

    socket.send(
      JSON.stringify({
        messageType: "position",
        data: {
          id: this.id,
          position: position,
        },
      }),
    );
  }

  tryMove(root: GameObject) {
    const chatInputActive = useStore.getState().chatInputActive;
    if (chatInputActive) return;

    const { input } = root;

    if (!input) return;

    // for animation
    if (!input.direction) {
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
    let nextX = this.destinationPosition.x;
    let nextY = this.destinationPosition.y;
    const gridSize = 16;

    if (input.direction === DOWN) {
      this.body.animations?.play("walkDown");
      nextY += gridSize;
      this.body.frame = 0;
    }

    if (input.direction === UP) {
      this.body.animations?.play("walkUp");
      nextY -= gridSize;
      this.body.frame = 6;
    }

    if (input.direction === RIGHT) {
      this.body.animations?.play("walkRight");
      nextX += gridSize;
      this.body.frame = 3;
    }

    if (input.direction === LEFT) {
      this.body.animations?.play("walkLeft");
      nextX -= gridSize;
      this.body.frame = 9;
    }

    if (isSpaceFree(walls, nextX, nextY)) {
      this.destinationPosition.x = nextX;
      this.destinationPosition.y = nextY;

      this.tryEmitNextPosition({ x: nextX, y: nextY });
    }
  }
}
