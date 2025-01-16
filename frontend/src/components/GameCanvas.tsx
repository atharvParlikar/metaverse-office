import { useEffect, useRef } from "react";
import { Sprite } from "../game/Sprite";
import { resources } from "../game/Resource";
import { Vector2, Vector2Raw } from "../game/Vector2";
import { gridCells } from "../game/helpers/grid";
import { Input } from "../game/Input";
import { GameLoop } from "../game/GameLoop";
import { GameObject } from "../game/GameObject";
import { Hero } from "../game/objects/hero/Hero";
import { Camera } from "../game/Camera";
import { getSocket } from "../util/socketChannel";
import { events } from "../game/Events";
import { RemoteHero } from "../game/objects/hero/RemoteHero";

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null!);
  const playersRef = useRef(new Map<number, RemoteHero>());
  const heroRef = useRef<Hero | null>(null!);
  const socket = getSocket();
  const positionInitSent = useRef<boolean>(false);

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
    heroRef.current = hero;

    const camera = new Camera();

    // Adding sprites to main scene
    mainScene.addChild(groundSprite);
    mainScene.addChild(hero);
    mainScene.addChild(camera);

    events.on(
      "add-player",
      mainScene,
      ({ id, position }: { id: number; position: Vector2 }) => {
        console.log("got here");
        console.log(id, position);
        const newPlayer = new RemoteHero(
          gridCells(position.x),
          gridCells(position.y),
        );
        mainScene.addChild(newPlayer);
        playersRef.current.set(id, newPlayer);
      },
    );

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
    if (!socket) return;

    socket.onopen = () => {
      if (heroRef.current) {
        if (!positionInitSent.current) {
          socket.send(
            JSON.stringify({
              messageType: "position-init",
              data: { position: heroRef.current.position.copyRaw() },
            }),
          );
          console.log("position-init sent!");
          positionInitSent.current = true;
        }
      }
    };

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

      if (messageType === "remote-position") {
        const { id, position }: { id: number; position: Vector2Raw } =
          parsedMessage;

        console.log("position: ", position);

        const remotePlayer = playersRef.current.get(id);
        if (!remotePlayer) {
          return;
        }

        remotePlayer.destinationPosition.x = position.x;
        remotePlayer.destinationPosition.y = position.y;
      }

      if (messageType === "players") {
        const { players }: { players: { id: number; position: Vector2Raw }[] } =
          parsedMessage;

        console.log("players: ", players);

        players.forEach((player) => {
          events.emit("add-player", {
            id: player.id,
            position: new Vector2(player.position.x, player.position.y),
          });
        });
      }

      if (messageType === "add-player") {
        const {
          id,
          position,
        }: { id: number; position: { x: number; y: number } } = parsedMessage;

        if (position) {
          events.emit("add-player", {
            id,
            position: new Vector2(position.x, position.y),
          });
          // if (heroRef.current) {
          //   socket.send(
          //     JSON.stringify({
          //       messageType: "add-player-back",
          //       data: {
          //         id,
          //         position: heroRef.current.position.copyRaw(),
          //       },
          //     }),
          //   );
          // }
        }
      }
    };
  }, [socket]);

  return (
    <div>
      <canvas ref={canvasRef} width={320} height={180}></canvas>
    </div>
  );
};

// context
//
// you are working on the multiplayer movement
// you have to do the following
//
// 1. create a broadcast function in golang |> DONE
// 2. handle the position change of players in frontned |> DONE
// 3. make sure the players joining later also have state
//    of all previously joined players.
