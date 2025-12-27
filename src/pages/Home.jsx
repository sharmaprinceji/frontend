import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Start a Video Meeting</h2>

      <button
        onClick={() => navigate("/room")}
        style={{
          padding: "12px 25px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Join Meet
      </button>
    </div>
  );
};

export default Home;
