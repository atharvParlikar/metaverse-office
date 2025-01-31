/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useEffect } from "react";

import { ChatPanel } from "../components/ChatPanel";
import { GameCanvas } from "../components/GameCanvas";
import {
  addSocketMessageEvent,
  getSocket,
  initializeSocket,
} from "../util/socketChannel";
import { useStore } from "../util/store";
import { useNavigate } from "react-router";
import { VideoCall } from "../components/VideoCall";
import toast from "react-hot-toast";
import { PhoneIncoming, PhoneMissed } from "lucide-react";
import Peer from "peerjs";

export const Room = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const roomIdSent = useRef<boolean>(false);
  const {
    id,
    wsReady,
    supabase,
    wsAuthenticated,
    setWsAuthenticated,
    setUserCallConsent,
    remoteCallConsent,
    setRemoteCallConsent,
    setRemoteVideoStream,
    setOnCall,
    toCall,
    connections,
    setConnections,
  } = useStore();
  const navigate = useNavigate();

  const peerRef = useRef<Peer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, []);

  useEffect(() => {
    const roomId = localStorage.getItem("roomId");
    if (!roomId || roomId.length === 0) {
      navigate("/");
      return;
    }

    if (socketRef.current) return;
    const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL;
    initializeSocket(SOCKET_URL);
    socketRef.current = getSocket();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    if (!wsReady) return;

    const socket = socketRef.current;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // TODO: deal with this better, this shit is just returning
      if (error) return;
      if (!session) return;

      socket.send(
        JSON.stringify({
          messageType: "auth",
          data: {
            jwt: session.access_token,
          },
        }),
      );

      addSocketMessageEvent("error", (parsedMessage) => {
        const { error }: { error: string } = parsedMessage;

        if (error) {
          toast.error(error);
        }
      });

      addSocketMessageEvent("auth", (parsedMessage) => {
        const { authenticated } = parsedMessage;
        if (authenticated) {
          setWsAuthenticated(true);
        }
      });

      addSocketMessageEvent("callConsentReq", (parsedMessage) => {
        const { id } = parsedMessage;
        toast.custom(
          <div className="flex flex-col bg-white rounded-md p-2 drop-shadow-lg text-center border-2 border-black">
            <span>User {id} is calling</span>
            <div className="flex justify-between">
              <div
                className="p-1 bg-green-500 rounded-md cursor-pointer border-2 border-black"
                onClick={() => {
                  socket.send(
                    JSON.stringify({
                      messageType: "callConsentAns",
                      data: {
                        id,
                        answer: true,
                      },
                    }),
                  );
                  setUserCallConsent(true);
                  toast.dismiss();
                }}
              >
                <PhoneIncoming />
              </div>

              <div
                className="p-1 bg-red-500 rounded-md cursor-pointer border-2 border-black"
                onClick={() => {
                  socket.send(
                    JSON.stringify({
                      messageType: "callConsentAns",
                      data: {
                        id,
                        answer: false,
                      },
                    }),
                  );
                  setUserCallConsent(false);
                  toast.dismiss();
                }}
              >
                <PhoneMissed />
              </div>
            </div>
          </div>,
        );
      });

      addSocketMessageEvent("callConsentAns", (parsedMessage) => {
        const { answer }: { answer: boolean } = parsedMessage;
        console.log("answer: ", answer);
        setRemoteCallConsent(answer);
      });
    });
  }, [socketRef, wsReady]);

  useEffect(() => {
    const call = async () => {
      if (!peerRef.current) return;
      if (!remoteCallConsent) return;
      if (!toCall?.id) return;

      console.log("got till here");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      mediaStreamRef.current = stream;

      const peer = peerRef.current;

      const call = peer.call(toCall.id?.toString(), stream);
      console.log("Call: ", call);
      call.on("stream", (remoteStream) => {
        console.log("Got video stream");
        setRemoteVideoStream(remoteStream);
        setOnCall(true);
      });

      call.on("close", () => {
        console.log("Got close signal");

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }

        setConnections([]);
        setOnCall(false);
        setRemoteVideoStream(null);
      });

      setConnections([...connections, call]);
    };

    call();
  }, [remoteCallConsent]);

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
      const userCallConsent = useStore.getState().userCallConsent;
      console.log("Got call, ", userCallConsent);
      if (!userCallConsent) return;
      setUserCallConsent(false);
      console.log("got here");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      mediaStreamRef.current = stream;

      call.answer(stream);
      call.on("stream", (remoteStream) => {
        //  TODO: do better error management
        setRemoteVideoStream(remoteStream);
        setOnCall(true);
      });

      call.on("close", () => {
        console.log("Got close signal");
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }
        setOnCall(false);
        setRemoteVideoStream(null);
      });

      setConnections([...connections, call]);
    });

    return () => {
      connections.forEach((connection) => connection.close());
      setConnections([]);
      peer.destroy();
    };
  }, [id]);

  useEffect(() => {
    if (!wsAuthenticated) return;

    const socket = socketRef.current;
    const roomId = localStorage.getItem("roomId");

    socket?.send(
      JSON.stringify({
        messageType: "room",
        data: {
          roomId,
        },
      }),
    );

    roomIdSent.current = true;
  }, [wsAuthenticated]);

  return (
    <div className="h-screen flex flex-col xl:grid xl:grid-cols-[4fr_1fr] md:grid-rows-none grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <GameCanvas className="md:h-full h-[70vh] min-h-[300px]" />
      <div className="md:h-full flex xl:flex-col border-t md:border-t-0 md:border-l">
        <VideoCall className="flex-1 min-h-[200px] md:min-h-0 my-auto" />
        <ChatPanel className="h-[30vh] md:h-auto md:flex-1" />
      </div>
    </div>
  );
};
