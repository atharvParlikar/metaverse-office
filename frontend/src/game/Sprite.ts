import { Animations } from "./Animations";
import { GameObject } from "./GameObject";
import { LoadedResource } from "./Resource";
import { Vector2 } from "./Vector2";

export class Sprite extends GameObject {
  resource: LoadedResource;
  frameSize: Vector2;
  hFrames: number;
  vFrames: number;
  frame: number;
  frameMap: Map<number, Vector2>;
  scale: number;
  position: Vector2;
  animations: Animations | null;

  constructor({
    resource, // image to draw
    frameSize, // size of crop of image
    hFrames, // how frames are arranged horizontally
    vFrames, // how frames are arranged vertically
    frame, // which frame we want to show
    scale, // how large to draw the image
    position, // where to draw it
    animations,
  }: {
    resource: LoadedResource;
    frameSize: Vector2;
    hFrames?: number;
    vFrames?: number;
    frame?: number;
    scale?: number;
    position?: Vector2;
    animations?: Animations;
  }) {
    super({ position: position ?? new Vector2() });
    this.resource = resource;
    this.frameSize = frameSize;
    this.hFrames = hFrames ?? 1;
    this.vFrames = vFrames ?? 1;
    this.frame = frame ?? 0;
    this.frameMap = new Map();
    this.scale = scale ?? 1;
    this.position = position ?? new Vector2();
    this.buildFrameMap();
    if (animations) {
      this.animations = animations;
    } else {
      this.animations = null;
    }
  }

  step(delta: number) {
    if (!this.animations) return;

    this.animations.step(delta);

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    this.frame = this.animations?.frame!;
  }

  buildFrameMap() {
    let frameCount = 0;
    for (let v = 0; v < this.vFrames; v++) {
      for (let h = 0; h < this.hFrames; h++) {
        this.frameMap.set(
          frameCount,
          new Vector2(h * this.frameSize.x, v * this.frameSize.y),
        );
        frameCount++;
      }
    }
  }

  drawImage(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (!this.resource.isLoaded) return;

    let frameCoordX = 0;
    let frameCoordY = 0;

    const frame = this.frameMap.get(this.frame);

    if (frame) {
      frameCoordX = frame.x;
      frameCoordY = frame.y;
    }

    const frameSizeX = this.frameSize.x;
    const frameSizeY = this.frameSize.y;

    ctx.drawImage(
      this.resource.image,
      frameCoordX,
      frameCoordY,
      frameSizeX,
      frameSizeY,
      x,
      y,
      frameSizeX * this.scale,
      frameSizeY * this.scale,
    );
  }
}
