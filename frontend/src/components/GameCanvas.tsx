import { useEffect, useRef } from "react";
import { Sprite } from "../game/Sprite";
import { resources } from "../game/Resource";
import { Vector2 } from "../game/Vector2";
import { gridCells } from "../game/helpers/grid";
import { Input } from "../game/Input";
import { GameLoop } from "../game/GameLoop";
import { GameObject } from "../game/GameObject";
import { Hero } from "../game/objects/hero/Hero";
import { Camera } from "../game/Camera";
import { getSocket } from "../util/socketChannel";
import { events } from "../game/Events";

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null!);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const input = new Input();

    const mainScene = new GameObject({
      position: new Vector2(0, 0),
      input,
    });

    // Sprites
    const skySprite = new Sprite({
      resource: resources.images.sky,
      frameSize: new Vector2(320, 180),
    });

    const groundSprite = new Sprite({
      resource: resources.images.ground,
      frameSize: new Vector2(320, 180),
    });

    const hero = new Hero(gridCells(6), gridCells(5));

    const camera = new Camera();

    // Adding sprites to main scene
    mainScene.addChild(groundSprite);
    mainScene.addChild(hero);
    mainScene.addChild(camera);

    const update = (delta: number) => {
      mainScene.stepEntry(delta, mainScene);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      skySprite.drawImage(ctx, 0, 0);

      // save current state
      ctx.save();

      // offset by camera position
      ctx.translate(camera.position.x, camera.position.y);

      // draw objects in the mounded scene
      mainScene.draw(ctx, 0, 0);

      // restore orignal state
      ctx.restore();
    };

    const gameLoop = new GameLoop(update, draw);
    gameLoop.start();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    console.log("Got socket successfully in useEffect");

    socket.onmessage = (e) => {
      const parsedMessage = JSON.parse(e.data);

      const { messageType } = parsedMessage;

      if (messageType === "id") {
        events.emit("set-hero-id", parsedMessage.id);
      }

      if (messageType === "position-init") {
        events.emit(
          "set-position",
          new Vector2(
            gridCells(parsedMessage.position.x),
            gridCells(parsedMessage.position.y),
          ),
        );
      }
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={320} height={180}></canvas>
    </div>
  );
};
