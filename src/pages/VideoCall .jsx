import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { useNavigate } from "react-router-dom";
import Chat from "./Chat";

const ROOM_ID = "demo-video";

const VideoCall = () => {
  const navigate = useNavigate();

  const bigVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const hasCreatedOfferRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);



  const [remoteStreams, setRemoteStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [remoteCameraState, setRemoteCameraState] = useState({});


  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ---------------- INIT ----------------
  useEffect(() => {
    const init = async () => {
      // 🎥 Local stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = localStream;
      setActiveStream(localStream); // BIG = local by default

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle remote tracks (IMPORTANT FIX)
      pc.ontrack = (e) => {
        const incomingStream = e.streams[0];
        const incomingTrack = e.track;

        const isLocalTrack = localStreamRef.current
          .getTracks()
          .some((t) => t.id === incomingTrack.id);

        if (isLocalTrack) return;

        // 🔥 socketId ko transceiver se attach karo (simple hack)
        const socketId = e.transceiver?.mid || "remote";

        setRemoteStreams((prev) => {
          if (prev.find((s) => s.stream.id === incomingStream.id)) return prev;
          return [...prev, { stream: incomingStream, socketId }];
        });
      };


      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            roomId: ROOM_ID,
            candidate: e.candidate,
          });
        }
      };

      socket.emit("join-video-room", { roomId: ROOM_ID });

      // 1️⃣ listeners FIRST
      socket.on("user-joined-video", async () => {
        if (hasCreatedOfferRef.current) return;

        hasCreatedOfferRef.current = true;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", {
          roomId: ROOM_ID,
          offer,
        });
      });

      socket.on("offer", async ({ offer }) => {
        await pc.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        for (const c of pendingIceCandidatesRef.current) {
          await pc.addIceCandidate(c);
        }
        pendingIceCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          roomId: ROOM_ID,
          answer,
        });
      });


      socket.on("answer", async ({ answer }) => {
        if (pc.signalingState !== "have-local-offer") return;

        await pc.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // 🔥 Flush queued ICE
        for (const c of pendingIceCandidatesRef.current) {
          await pc.addIceCandidate(c);
        }
        pendingIceCandidatesRef.current = [];
      });



      socket.on("ice-candidate", async ({ candidate }) => {
        if (!pc.remoteDescription) {
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }

        await pc.addIceCandidate(candidate);
      });

      socket.on("camera-state", ({ socketId, cameraOff }) => {
        console.log("Remote camera changed:", socketId, cameraOff);

        setIsCameraOff(cameraOff);
        setRemoteCameraState((prev) => ({
          ...prev,
          [socketId]: cameraOff,
        }));

      });

    };

    init();

    return () => {
      socket.off();
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ---------------- BIG VIDEO ----------------
  useEffect(() => {
    if (bigVideoRef.current && activeStream) {
      bigVideoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  // ---------------- CONTROLS ----------------
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;

    setIsCameraOff(!track.enabled);

    // 🔥 notify others
    socket.emit("camera-state", {
      roomId: ROOM_ID,
      cameraOff: !track.enabled,
    });
  };


  const leaveCall = () => {
    hasCreatedOfferRef.current = false;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    navigate("/");
  };

  const smallStreams = [];

  // ✅ local small tabhi jab BIG nahi hai
  if (
    localStreamRef.current &&
    activeStream !== localStreamRef.current
  ) {
    smallStreams.push(localStreamRef.current);
  }

  // ✅ remote small tabhi jab BIG nahi hai
  remoteStreams.forEach((s) => {
    if (s !== activeStream) {
      smallStreams.push(s);
    }
  });

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      {/* VIDEO AREA */}
      <div style={{ width: "70%", background: "#000", position: "relative" }}>
        {/* BIG VIDEO */}
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
          {smallStreams.map(({ stream, socketId }) => {
            return (
              <div
                key={stream.id}
                style={{ position: "relative", width: 140, height: 100 }}
              >
                <video
                  autoPlay
                  playsInline
                  ref={(el) => el && (el.srcObject = stream)}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: isCameraOff ? "none" : "block",
                  }}
                />

                {isCameraOff && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "black",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    Camera Off
                  </div>
                )}
              </div>
            );
          })}

          {/* {smallStreams.map(({ stream, socketId }) => {
            const isCamOff =
              socketId !== "local" && remoteCameraState[socketId];

            return (
              <div
                key={stream.id + socketId}
                style={{ position: "relative", width: 140, height: 100 }}
              >
                <video
                  autoPlay
                  playsInline
                  muted={socketId === "local"}
                  ref={(el) => el && (el.srcObject = stream)}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: isCamOff ? "none" : "block",
                  }}
                />

                {isCamOff && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "black",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    Camera Off
                  </div>
                )}
              </div>
            );
          })} */}


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
          <button onClick={toggleMute}>
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button onClick={toggleCamera} style={{ marginLeft: 10 }}>
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
          <button
            onClick={leaveCall}
            style={{ marginLeft: 10, color: "red" }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div style={{ width: "30%", borderLeft: "1px solid #ddd" }}>
        <Chat />
      </div>
    </div>
  );
};

export default VideoCall;


