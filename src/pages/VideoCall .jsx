import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { useNavigate } from "react-router-dom";
import Chat from "./Chat";

const ROOM_ID = "demo-video";

const VideoCall = () => {
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const bigVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 🎥 Local media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Default BIG = local video
      setActiveStream(localStream.current);

      localVideoRef.current.srcObject = localStream.current;

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      localStream.current.getTracks().forEach(track =>
        peerConnection.current.addTrack(track, localStream.current)
      );
      

      // peerConnection.current.ontrack = (e) => {
      //   const stream = e.streams[0];

      //   setRemoteStreams(prev => {
      //     if (prev.find(s => s.id === stream.id)) return prev;
      //     return [...prev, stream];
      //   });

      //   // 👇 Remote join → make BIG
      //   setActiveStream(stream);
      // };

      peerConnection.current.ontrack = (e) => {
  const incomingStream = e.streams[0];

  // ❗ IMPORTANT: ignore local stream echoed back
  if (incomingStream.id === localStream.current.id) {
    return;
  }

  setRemoteStreams(prev => {
    if (prev.find(s => s.id === incomingStream.id)) return prev;
    return [...prev, incomingStream];
  });
};


      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            roomId: ROOM_ID,
            candidate: e.candidate,
          });
        }
      };

      socket.emit("join-video-room", { roomId: ROOM_ID });

      socket.on("user-joined-video", async () => {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit("offer", { roomId: ROOM_ID, offer });
      });

      socket.on("offer", async (offer) => {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { roomId: ROOM_ID, answer });
      });

      socket.on("answer", async (answer) => {
        await peerConnection.current.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async (candidate) => {
        await peerConnection.current.addIceCandidate(candidate);
      });
      console.log('remote stram id ====>87',remoteStreams.map(s => s.id))
      console.log("loacl stream id===>",localStream.current);
    };

    init();

    return () => {
      socket.off();
      peerConnection.current?.close();
      localStream.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 🎯 BIG SCREEN stream assign
  useEffect(() => {
    if (bigVideoRef.current && activeStream) {
      bigVideoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  const toggleMute = () => {
    const track = localStream.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  // const toggleCamera = () => {
  //   const track = localStream.current.getVideoTracks()[0];
  //   track.enabled = !track.enabled;
  //   setIsCameraOff(!track.enabled);
  // };
 const toggleCamera = () => {
  const track = localStream.current.getVideoTracks()[0];
  const cameraNowOff = track.enabled; // before toggle

  track.enabled = !track.enabled;
  setIsCameraOff(cameraNowOff);

  // 🔥 FORCE BIG SCREEN UPDATE
  if (cameraNowOff) {
    // camera turned OFF
    if (remoteStreams.length > 0) {
      setActiveStream(remoteStreams[0]); // show remote BIG
    }
  } else {
    // camera turned ON
    setActiveStream(localStream.current); // show self BIG again
  }
};



  const leaveCall = () => {
    socket.disconnect();
    navigate("/");
  };

  return (
    <div style={{ height: "100%", display: "flex" }}>
      
      {/* VIDEO AREA */}
      <div style={{ width: "75%", background: "#000", position: "relative" }}>
        
        {/* BIG VIDEO (16:9) */}
        <div style={{ width: "100%", height: "100%" }}>
          <video
            ref={bigVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "black",
            }}
          />
        </div>

       {/* LOCAL SMALL VIDEO */}
<video
  ref={localVideoRef}
  autoPlay
  muted
  playsInline
  onClick={() => setActiveStream(localStream.current)}
  style={{
    width: 160,
    height: 120,
    position: "absolute",
    bottom: 20,
    right: 20,
    cursor: "pointer",
    border: "2px solid white",
    borderRadius: 6,
  }}
/>


       {/* SMALL THUMBNAILS */}
<div
  style={{
    position: "absolute",
    bottom: 20,
    left: 20,
    display: "flex",
    gap: 10,
  }}
>
  {/* LOCAL thumbnail (only if NOT active) */}
  {activeStream !== localStream.current && (
    <video
      autoPlay
      muted
      playsInline
      onClick={() => setActiveStream(localStream.current)}
      ref={(el) => el && (el.srcObject = localStream.current)}
      style={{
        width: 140,
        height: 100,
        cursor: "pointer",
        border: "2px solid white",
        borderRadius: 6,
      }}
    />
  )}

  {/* REMOTE thumbnails (except active) */}
  {remoteStreams
    .filter((stream) => stream !== activeStream)
    .map((stream) => (
      <video
        key={stream.id}
        autoPlay
        playsInline
        onClick={() => setActiveStream(stream)}
        ref={(el) => el && (el.srcObject = stream)}
        style={{
          width: 140,
          height: 100,
          cursor: "pointer",
          border: "2px solid white",
          borderRadius: 6,
        }}
      />
    ))}
</div>


        {/* CONTROLS */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
          <button onClick={toggleCamera} style={{ marginLeft: 10 }}>
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
          <button onClick={leaveCall} style={{ marginLeft: 10, color: "red" }}>
            Leave
          </button>
        </div>
      </div>

      {/* CHAT RIGHT SIDE */}
      <div style={{ width: "35%", height:"100%", borderLeft: "1px solid #ddd" }}>
        <Chat />
      </div>
    </div>
  );
};

export default VideoCall;
