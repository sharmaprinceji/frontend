import { socket } from "../services/socket";
import { useState } from "react";

export default function Controls({ localStream, roomId }) {
  if (!localStream) return null;

  // UI STATES
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const toggleMute = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };
  // const track = localStreamRef.current?.getAudioTracks()[0];
  //   if (!track) return;
  //   track.enabled = !track.enabled;
  //   setIsMuted(!track.enabled);

  const toggleCamera = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  };

  const leaveCall = () => {
    localStream.getTracks().forEach(track => track.stop());
    socket.emit("leave-room", { roomId });
    window.location.href = "/";
  };

  return (
    <div style={{ marginTop: 10,display:"flex",gap:"5px" }}>
      <button onClick={toggleMute}>
        {isMuted ? "Unmute" : "Mute"}
      </button>

      <button onClick={toggleCamera}>
        {isCameraOff ? "Camera On" : "Camera Off"}
      </button>

      <button onClick={leaveCall}>Leave</button>
    </div>
  );
}
