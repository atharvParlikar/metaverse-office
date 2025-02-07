import { GameObject } from "../GameObject";
import { Input } from "../Input";
import { Vector2 } from "../Vector2";

interface TileData {
  id: number;
  solid?: boolean;
}

export class Tilemap extends GameObject {
  private baseTileSize: number = 16;
  private scale: number;
  private tiles: TileData[][];
  private tileset: HTMLImageElement;
  private mapWidth: number;
  private mapHeight: number;
  private tilesPerRow: number;

  constructor({
    position,
    drawOffset,
    input,
    mapWidth,
    mapHeight,
    tilesetSrc,
    tilesPerRow,
    scale = 6,
  }: {
    position?: Vector2;
    drawOffset?: Vector2;
    input?: Input;
    mapWidth: number;
    mapHeight: number;
    tilesetSrc: string;
    tilesPerRow: number;
    scale?: number;
  }) {
    super({ position, drawOffset, input });

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.tilesPerRow = tilesPerRow;
    this.scale = scale;

    // Initialize empty tile array
    this.tiles = Array(mapHeight)
      .fill(null)
      .map(() =>
        Array(mapWidth)
          .fill(null)
          .map(() => ({ id: -1 })),
      );

    // Load tileset image
    this.tileset = new Image();
    this.tileset.src = tilesetSrc;
  }

  // Get the actual tile size after scaling
  get tileSize(): number {
    return this.baseTileSize * this.scale;
  }

  // Set a tile at specific coordinates
  setTile(x: number, y: number, tileData: TileData) {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      this.tiles[y][x] = tileData;
    }
  }

  // Get a tile at specific coordinates
  getTile(x: number, y: number): TileData | null {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      return this.tiles[y][x];
    }
    return null;
  }

  // Load a map from a 2D array
  loadMap(mapData: number[][]) {
    for (let y = 0; y < Math.min(mapData.length, this.mapHeight); y++) {
      for (let x = 0; x < Math.min(mapData[y].length, this.mapWidth); x++) {
        this.tiles[y][x] = { id: mapData[y][x] };
      }
    }
  }

  // Override drawImage to render the tilemap
  override drawImage(
    ctx: CanvasRenderingContext2D,
    drawPosX: number,
    drawPosY: number,
  ) {
    // Only proceed if tileset is loaded
    if (!this.tileset.complete) return;

    // Set pixel rendering to crisp edges
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y][x];
        if (tile.id === -1) continue; // Skip empty tiles

        // Calculate source coordinates in tileset
        const srcX = (tile.id % this.tilesPerRow) * this.baseTileSize;
        const srcY = Math.floor(tile.id / this.tilesPerRow) * this.baseTileSize;

        // Calculate destination coordinates on canvas
        const destX = drawPosX + x * this.tileSize;
        const destY = drawPosY + y * this.tileSize;

        ctx.drawImage(
          this.tileset,
          srcX,
          srcY,
          this.baseTileSize,
          this.baseTileSize,
          destX,
          destY,
          this.tileSize,
          this.tileSize,
        );
      }
    }
  }

  // Helper method to convert pixel coordinates to tile coordinates
  pixelToTileCoords(x: number, y: number): Vector2 {
    return new Vector2(
      Math.floor(x / this.tileSize),
      Math.floor(y / this.tileSize),
    );
  }

  // Helper method to convert tile coordinates to pixel coordinates
  tileToPixelCoords(x: number, y: number): Vector2 {
    return new Vector2(x * this.tileSize, y * this.tileSize);
  }
}
