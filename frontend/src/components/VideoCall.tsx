import { useEffect, useRef } from "react";
import { useStore } from "../util/store";
import { Button } from "./ui/button";
import { getSocket } from "../util/socketChannel";

export function VideoCall({ className }: { className?: string }) {
  const { remoteVideoStream, onCall, canCall, connections, toCall } =
    useStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socket = getSocket();

  const handleCall = async () => {
    if (onCall) {
      connections.forEach((connection) => {
        connection.close();
      });
      return;
    }

    if (!toCall) return;
    if (!toCall.id) return;

    // no need to check for existance of socket here
    socket?.send(
      JSON.stringify({
        messageType: "callConsentReq",
        data: {
          id: toCall.id,
        },
      }),
    );
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = remoteVideoStream;
  }, [remoteVideoStream, videoRef]);

  return (
    <div className={`${className} w-full flex flex-col gap-2 items-center`}>
      {remoteVideoStream ? (
        <video
          className="border-2 border-black w-full"
          ref={videoRef}
          autoPlay
        />
      ) : (
        <div className="flex items-center justify-center border-2 border-black w-full">
          No Signal X(
        </div>
      )}

      <div className="flex gap-4">
        <Button
          className={`border-2 border-black p-2 px-4 rounded-none ${onCall ? "bg-green-400 text-black hover:bg-green-500" : canCall ? "bg-green-400 text-black hover:bg-green-500" : "bg-red-600 text-white"}`}
          disabled={onCall ? false : !canCall}
          onClick={handleCall}
        >
          {!onCall ? "call" : "disconnect"}
        </Button>
        <Button
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
        </Button>
      </div>
    </div>
  );
}
