/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
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
import { useStore } from "../util/store";
import Peer, { MediaConnection } from "peerjs";

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null!);
  const heroRef = useRef<Hero | null>(null!);
  const peerRef = useRef<Peer | null>(null);
  const socket = getSocket();
  const positionInitSent = useRef<boolean>(false);
  const {
    id,
    setId,
    addPlayer,
    canCall,
    toCall,
    wsReady,
    setRemoteVideoStream,
  } = useStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [onCall, setOnCall] = useState<boolean>(false);

  const connections = useRef<MediaConnection[]>([]);

  const log = (str: string) => setLogs((x) => [...x, str]);

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

    // Adding sprites to main main
    mainScene.addChild(groundSprite);
    mainScene.addChild(hero);
    mainScene.addChild(camera);

    events.on(
      "add-player",
      mainScene,
      ({ id, position }: { id: number; position: Vector2 }) => {
        const newPlayer = new RemoteHero(
          gridCells(position.x),
          gridCells(position.y),
        );
        newPlayer.id = id;
        mainScene.addChild(newPlayer);
        addPlayer(id, newPlayer);
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
      const { players }: { players: { id: number; position: Vector2Raw }[] } =
        parsedMessage;

      players.forEach((player) => {
        if (player.id !== heroRef.current?.id)
          events.emit("add-player", {
            id: player.id,
            position: new Vector2(player.position.x, player.position.y),
          });
      });
    });

    addSocketMessageEvent("add-player", (parsedMessage) => {
      const {
        id,
        position,
      }: { id: number; position: { x: number; y: number } } = parsedMessage;

      if (position) {
        events.emit("add-player", {
          id,
          position: new Vector2(position.x, position.y),
        });
      }
    });
  }, [socket, wsReady]);

  // peerjs stuff
  useEffect(() => {
    if (!id) return;
    //  NOTE: maybe put this as global state in zustand store
    const peer = new Peer(id.toString(), {
      host: "localhost",
      port: 9000,
      path: "/frontend",
    });
    peerRef.current = peer;

    peer.on("call", async (call) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        //  TODO: do better error management
        setRemoteVideoStream(remoteStream);
        setOnCall(true);
      });

      call.on("close", () => {
        console.log("Got close signal");
        connections.current.forEach((connection) => {
          if (connection.remoteStream) {
            connection.remoteStream.getTracks().forEach((track) => {
              console.log("stopping track: ", track.kind);
              track.stop();
            });
            connection.close();
          }
        });
        connections.current = [];
        setOnCall(false);
        setRemoteVideoStream(null);
      });

      connections.current = [...connections.current, call];
    });

    return () => {
      connections.current.forEach((connection) => connection.close());
      connections.current = [];
    };
  }, [id]);

  const handleCall = async () => {
    log("call button clicked!!!");
    console.log("call button clicked!!!");
    if (!peerRef.current) return;

    if (onCall) {
      connections.current.forEach((connection) => {
        connection.remoteStream.getTracks().forEach((track) => {
          console.log(track.kind);
          track.stop();
        });
        connection.close();
      });
      return;
    }

    if (!toCall) return;
    if (!toCall.id) return;

    log("got until getMediaDevices");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    const peer = peerRef.current;

    const call = peer.call(toCall.id?.toString(), stream);
    call.on("stream", (remoteStream) => {
      setRemoteVideoStream(remoteStream);
      setOnCall(true);
    });

    call.on("close", () => {
      console.log("Got close signal");
      connections.current.forEach((connection) => {
        if (connection.remoteStream) {
          connection.remoteStream.getTracks().forEach((track) => {
            console.log("stopping track: ", track.kind);
            track.stop();
          });
          connection.close();
        }
      });
      connections.current = [];
      setOnCall(false);
      setRemoteVideoStream(null);
    });

    connections.current = [...connections.current, call];
  };

  return (
    <div>
      <canvas ref={canvasRef} width={320} height={180}></canvas>
      <div>
        <button
          className={`border-2 border-black p-2 px-4 ${onCall ? "bg-green-400" : canCall ? "bg-green-400" : "bg-red-600 text-white"}`}
          disabled={onCall ? false : !canCall}
          onClick={handleCall}
        >
          {!onCall ? "call" : "disconnect"}
        </button>
        <button
          onClick={() => {
            const socket = getSocket();
            socket?.send(
              JSON.stringify({
                messageType: "room",
                data: {
                  roomId: "123",
                },
              }),
            );
          }}
        >
          Debug
        </button>
      </div>
      <p>{toCall && toCall.id}</p>
      <p>Logs</p>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
    </div>
  );
};
