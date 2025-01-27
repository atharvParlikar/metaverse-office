import { useEffect, useRef } from "react";
import { useStore } from "../util/store";

export function VideoCall({ className }: { className?: string }) {
  const { remoteVideoStream } = useStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = remoteVideoStream;
  }, [remoteVideoStream, videoRef]);

  return (
    <div className={`${className} w-full`}>
      {remoteVideoStream ? (
        <video
          className="border-2 border-black w-full"
          ref={videoRef}
          autoPlay
        />
      ) : (
        <div className="flex items-center justify-center border-2 border-black">
          No Signal :X
        </div>
      )}
    </div>
  );
}
