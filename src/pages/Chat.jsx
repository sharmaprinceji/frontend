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
    <div style={{ padding: 20 }}>
      <h2>Chat Room</h2>

      <div style={{ border: "1px solid #ccc", padding: 10, height: 300, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.user}:</b> {m.message}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
