import { useEffect, useRef, useState } from "react";
import { useSFU } from "../hooks/useSFU";
import Controls from "../components/Controls";
import Chat from "./Chat";
import "./room.css";

const PAGE_SIZE = 3;

export default function Room() {
  const localVideoRef = useRef(null);
  const videoRefs = useRef({});

  // ✅ MAP: peerId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState({});
  const [activeStream, setActiveStream] = useState("local");
  const [page, setPage] = useState(0);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const roomName = localStorage.getItem("roomName") || "demo-video";

  const hasVideoTrack = (stream) =>
    stream &&
    stream.getVideoTracks &&
    stream.getVideoTracks().length > 0;

  const handleRemoteStream = (stream, peerId) => {
    setRemoteStreams(prev => ({
      ...prev,
      [peerId]: stream
    }));

  };

  const { start, getLocalStream } = useSFU(roomName, handleRemoteStream);

  /* ---------- START SFU ---------- */
  useEffect(() => {
    start(localVideoRef);
  }, []);

  /* ---------- PAGINATION ---------- */
  const remoteEntries = Object.entries(remoteStreams);
  const startIdx = page * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const visibleStreams = remoteEntries.slice(startIdx, endIdx);
  const remainingCount = Math.max(0, remoteEntries.length - endIdx);

  useEffect(() => setPage(0), [remoteEntries.length]);

  /* ---------- BIG VIDEO (REMOTE) ---------- */
  const showInBigScreen = (stream) => {
    const video = localVideoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.muted = false;

    video.onloadedmetadata = () => {
      video.play().catch(() => { });
    };

    setActiveStream("remote");
  };

  /* ---------- BIG VIDEO (LOCAL) ---------- */
  const showLocalInBigScreen = () => {
    const video = localVideoRef.current;
    const localStream = getLocalStream();
    if (!video || !localStream) return;

    video.srcObject = localStream;
    video.muted = true;

    video.onloadedmetadata = () => {
      video.play().catch(() => { });
    };

    setActiveStream("local");
  };

  // visibleStreams.filter(([_, stream]) => hasVideoTrack(stream)).map(([peerId, stream])=>{
  //   console.log('========>122:',peerId, "video tracks:",
  // stream.getVideoTracks().length,
  // "audio tracks:",
  // stream.getAudioTracks().length);
  // })

  return (
    <div className="room-layout">
      <div className="video-area">
        {/* BIG VIDEO */}
        <div className="big-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={activeStream === "local"}
            className="big-video"
            onClick={showLocalInBigScreen}
          />
          <div className="video-controls-overlay">
            <Controls
              localStream={getLocalStream()}
              roomId={roomName}
            />
          </div>

          <button
            className="mobile-chat-btn"
            onClick={() => setShowChatMobile(true)}
          >
            Chat
          </button>
        </div>

        {/* SMALL VIDEOS */}
        <div className="small-video-column">
          <div className="small-video-list">
            {visibleStreams
              .filter(([_, stream]) => hasVideoTrack(stream))
              .map(([peerId, stream]) => (
                <video
                  key={peerId}
                  muted
                  autoPlay
                  playsInline
                  className="small-video"
                  ref={el => {
                    if (!el) return;

                    // 🔒 HARD GUARD
                    if (el.srcObject === stream) return;

                    console.log("🎥 binding small video:", peerId);

                    el.srcObject = stream;
                    el.muted = true;

                    el.onloadedmetadata = () => {
                      el.play().catch(err =>
                        console.warn("play blocked:", err)
                      );
                    };
                  }}
                  onClick={() => showInBigScreen(stream)}
                />



              ))
            }
          </div>

          <div className="thumbnail-pagination">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <button
              disabled={endIdx >= remoteEntries.length}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>

          {remainingCount > 0 && (
            <div className="more-count">+{remainingCount} more</div>
          )}
        </div>
      </div>

      {/* CHAT */}
      <div className="chat-area">
        <Chat />
      </div>

      <div className={`chat-area ${showChatMobile ? "show-chat" : ""}`}>
        <button
          className="close-chat-btn"
          onClick={() => setShowChatMobile(false)}
        >
          ✕
        </button>
        <Chat />
      </div>
    </div>
  );
}
