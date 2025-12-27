import { socket } from "../services/socket";
const Header = () => {
  return (
    <header
      style={{
        padding: "15px",
        backgroundColor: "#1a73e8",
        color: "white",
        textAlign: "center",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      Welcome to my PincoderMeet App
    </header>
  );
};

export default Header;
