import { useEffect, useRef, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import Controls from "../components/Controls";
import Chat from "./Chat";
import "./room.css";   // 🔥 external CSS

const PAGE_SIZE = 3;

export default function Room() {
  const {
    localVideoRef,
    localStream,
    streams,
    activeId,
    setActiveId
  } = useWebRTC("demo-video");

  const videoRefs = useRef({});
  const [page, setPage] = useState(0);

  // Attach streams to video elements
  useEffect(() => {
    streams.forEach(({ id, stream }) => {
      const videoEl =
        id === "local"
          ? localVideoRef.current
          : videoRefs.current[id];

      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [streams, activeId]);

  // Reset pagination when users change
  useEffect(() => {
    setPage(0);
  }, [streams.length]);

  /* ---------- PAGINATION LOGIC ---------- */
  const smallStreams = streams.filter(s => s.id !== activeId);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleStreams = smallStreams.slice(start, end);
  const remainingCount = Math.max(0, smallStreams.length - end);

  return (
    <>
      {/* MAIN LAYOUT */}
      <div className="room-layout">
        {/* LEFT: VIDEO AREA */}
        <div className="video-area">
          {/* BIG VIDEO + CONTROLS */}
          <div className="big-video-container">
            {streams
              .filter(s => s.id === activeId)
              .map(s => (
                <video
                  key={s.id}
                  ref={el => {
                    if (s.id === "local") {
                      localVideoRef.current = el;
                    } else {
                      videoRefs.current[s.id] = el;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted={s.id === "local"}
                  className="big-video"
                />
              ))}

            {/*CONTROLS OVERLAY */}
            <div className="video-controls-overlay">
              <Controls
                localStream={localStream}
                roomId="demo-video"
              />
            </div>
          </div>

          {/* SMALL VIDEOS */}
          <div className="small-video-column">
            <div className="small-video-list">
              {visibleStreams.map(s => (
                <video
                  key={s.id}
                  ref={el => (videoRefs.current[s.id] = el)}
                  autoPlay
                  playsInline
                  muted
                  onClick={() => setActiveId(s.id)}
                  className="small-video"
                />
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="thumbnail-pagination">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                Prev
              </button>

              <button
                disabled={end >= smallStreams.length}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>

            {remainingCount > 0 && (
              <div className="more-count">
                +{remainingCount} more
              </div>
            )}
          </div>
        </div>

        <div className="chat-area">
          <Chat />
        </div>
      </div>
    </>
  );
}
