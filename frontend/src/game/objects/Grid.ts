import { Camera } from "../Camera";
import { GameObject } from "../GameObject";

const WIDTH = 320 * 6;
const HEIGHT = 180 * 6;

export class Grid extends GameObject {
  private camera: Camera;

  constructor(camera: Camera) {
    super({});
    this.camera = camera;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const cellSize = 16 * 6; // 96 pixels per grid cell
    const tx = this.camera.position.x;
    const ty = this.camera.position.y;

    // Calculate visible area in world coordinates
    const visibleXStart = -tx;
    const visibleXEnd = -tx + WIDTH;
    const visibleYStart = -ty;
    const visibleYEnd = -ty + HEIGHT;

    // Calculate grid bounds for the visible area
    const startX = Math.floor(visibleXStart / cellSize) * cellSize;
    const endX = Math.ceil(visibleXEnd / cellSize) * cellSize;
    const startY = Math.floor(visibleYStart / cellSize) * cellSize;
    const endY = Math.ceil(visibleYEnd / cellSize) * cellSize;

    ctx.strokeStyle = "rgba(255, 0, 0, 0.2)"; // Semi-transparent red lines
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = startX; x <= endX; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = startY; y <= endY; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }
}
