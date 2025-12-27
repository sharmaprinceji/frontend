import { useEffect, useState } from "react";
import { socket } from "../services/socket";

const ROOM_ID = "demo-room";

function Chat() {
  const [user] = useState("Prince");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("join-room", { roomId: ROOM_ID, user });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [user]);

  const sendMessage = () => {
    if (!message) return;

    socket.emit("send-message", {
      roomId: ROOM_ID,
      user,
      message,
    });

    setMessage("");
  };

  return (
    <div
  style={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "12px"
  }}
>
  <h2 style={{ margin: "0 0 5px 0" }}>Chat Room</h2>

  <div
    style={{
      flex: 1,
      overflowY: "auto",
      border: "1px solid #ddd",
      padding: "8px",
      marginBottom: "10px"
    }}
  >
    {messages.map((m, i) => (
      <div key={i} style={{ marginBottom: "6px" }}>
        <b>{m.user}:</b> {m.message}
      </div>
    ))}
  </div>

  <div
    style={{
      display: "flex",
      gap: "6px"
    }}
  >
    <input
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Type message"
      style={{
        flex: 1,
        padding: "6px"
      }}
    />
    <button
      onClick={sendMessage}
      style={{
        padding: "6px 12px",
        cursor: "pointer",
        marginBottom:"10px",
      }}
    >
      Send
    </button>
  </div>
</div>

  );
}

export default Chat;
