
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [room, setRoom] = useState("demo-video");

  const handleJoin = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // 🔥 Save to localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("roomName", room);

    navigate("/room");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5"
      }}
    >
      <div
        style={{
          width: "300px",
          padding: "30px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Start a Video Meeting
        </h2>

        {/* NAME INPUT */}
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        />

        {/* ROOM SELECT */}
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{
            width: "90%",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        >
          <option value="demo-video">Demo Room</option>
          <option value="team-meet">Team Meeting</option>
          <option value="private-room">Private Room</option>
        </select>

        {/* JOIN BUTTON */}
        <button
          onClick={handleJoin}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Join Meet
        </button>
      </div>
    </div>
  );
};

export default Home;
