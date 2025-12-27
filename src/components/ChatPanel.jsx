import { useEffect, useState } from "react";
import { socket } from "../services/socket";

const ChatPanel = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive-message");
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      message: text,
      sender: "User",
    });

    setMessages((prev) => [...prev, { sender: "Me", message: text }]);
    setText("");
  };

  return (
    <div style={{ width: "25%", borderLeft: "1px solid #ddd", padding: 10 }}>
      <h3>Chat</h3>

      <div style={{ height: "80%", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.sender}:</b> {m.message}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
        style={{ width: "100%" }}
      />
      <button onClick={sendMessage} style={{ width: "100%" }}>
        Send
      </button>
    </div>
  );
};

export default ChatPanel;
