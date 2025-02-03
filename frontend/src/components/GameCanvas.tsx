/* eslint-disable react-hooks/exhaustive-deps */
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
import { addSocketMessageEvent, getSocket } from "../util/socketChannel";
import { events } from "../game/Events";
import { RemoteHero } from "../game/objects/hero/RemoteHero";
import { Grid } from "../game/objects/Grid";
import { useStore } from "../util/store";

const WIDTH = 320 * 6;
const HEIGHT = 180 * 6;

export const GameCanvas = ({ className }: { className: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null!);
  const heroRef = useRef<Hero | null>(null!);
  const socket = getSocket();
  const positionInitSent = useRef<boolean>(false);
  const { setId, addPlayer, wsReady } = useStore();

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
      frameSize: new Vector2(HEIGHT, WIDTH),
      scale: 6,
    });

    const groundSprite = new Sprite({
      resource: resources.images.ground,
      frameSize: new Vector2(HEIGHT, WIDTH),
      scale: 6,
    });

    //  HACK: Figure out how to properly divide canvas into blocks, these magic numbers work for now...
    const hero = new Hero(gridCells(5.5), gridCells(3.75)); // idk man these numbers seem to work after scaling
    hero.body.text = "me";
    heroRef.current = hero;

    const camera = new Camera();
    const grid = new Grid(camera);

    // Adding sprites to main main
    mainScene.addChild(groundSprite);
    mainScene.addChild(grid);
    mainScene.addChild(hero);
    mainScene.addChild(camera);

    events.on(
      "add-player",
      mainScene,
      ({
        id,
        position,
        name,
      }: {
        id: number;
        position: Vector2;
        name: string;
      }) => {
        const newPlayer = new RemoteHero(position.x, position.y);
        console.log("Setting new player name: ", name);
        newPlayer.body.text = name;
        newPlayer.id = id;
        mainScene.addChild(newPlayer);
        addPlayer(id, newPlayer);
      },
    );

    events.on("remove-player", mainScene, ({ id }: { id: number }) => {
      mainScene.children = mainScene.children.filter((child) => {
        if ("id" in child) {
          // checking if child is Hero or RemoteHero
          return child.id !== id;
        }
        return true;
      });
    });

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
    if (!wsReady) return;

    addSocketMessageEvent("id", (parsedMessage) => {
      events.emit("set-hero-id", parsedMessage.id);
      setId(parsedMessage.id);
    });

    socket.onopen = () => {
      if (heroRef.current) {
        if (!positionInitSent.current) {
          socket.send(
            JSON.stringify({
              messageType: "position-init",
              data: { position: heroRef.current.position.copyRaw() },
            }),
          );
          positionInitSent.current = true;
        }
      }
    };

    // Socket message events
    addSocketMessageEvent("position-init", (parsedMessage) => {
      events.emit(
        "set-position",
        new Vector2(
          gridCells(parsedMessage.position.x),
          gridCells(parsedMessage.position.y),
        ),
      );
    });

    addSocketMessageEvent("remote-position", (parsedMessage) => {
      const { id, position }: { id: number; position: Vector2Raw } =
        parsedMessage;

      const remotePlayer = useStore.getState().remotePlayers.get(id);
      if (!remotePlayer) {
        return;
      }

      remotePlayer.destinationPosition.x = position.x;
      remotePlayer.destinationPosition.y = position.y;
    });

    addSocketMessageEvent("players", (parsedMessage) => {
      const {
        players,
      }: { players: { id: number; position: Vector2Raw; name: string }[] } =
        parsedMessage;

      console.log("got players:");
      console.log(parsedMessage);

      players.forEach((player) => {
        if (player.id !== heroRef.current?.id)
          events.emit("add-player", {
            id: player.id,
            position: new Vector2(
              player.position.x / (16 * 6),
              player.position.y / (16 * 6),
            ),
            name: player.name,
          });
      });
    });

    addSocketMessageEvent("add-player", (parsedMessage) => {
      const {
        id,
        position,
        name,
      }: { id: number; position: { x: number; y: number }; name: string } =
        parsedMessage;

      console.log("parsedMessage: ", parsedMessage);

      if (position) {
        events.emit("add-player", {
          id,
          position: new Vector2(position.x, position.y),
          name,
        });
      }
    });

    addSocketMessageEvent("player-left", (parsedMessage) => {
      const { id } = parsedMessage;
      events.emit("remove-player", { id });
    });
  }, [socket, wsReady]);

  return (
    <div className={`${className}`}>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
    </div>
  );
};
