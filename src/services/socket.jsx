import { io } from "socket.io-client";

//const SOCKET_URL = "http://localhost:5000";

// export const socket = io(SOCKET_URL, {
//   transports: ["websocket"],
//   autoConnect: true,
// });

// export const socket = io("http://localhost:8080", {
//   transports: ["websocket"],
// });

///ngrok...config setp...
export const socket = io("/", {
  path: "/socket.io",
  transports: ["websocket"],
});


// export const socket = io(import.meta.env.VITE_SOCKET_URL, {
//   path: "/socket.io",
//   transports: ["websocket"],
// });

