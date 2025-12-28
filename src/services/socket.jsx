import { io } from "socket.io-client";

//const SOCKET_URL = "http://localhost:5000";

// export const socket = io(SOCKET_URL, {
//   transports: ["websocket"],
//   autoConnect: true,
// });

export const socket = io("/api", {
  path: "/socket.io",
  transports: ["websocket"],
});
