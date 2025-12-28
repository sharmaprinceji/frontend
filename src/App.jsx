import { useState,useEffect } from 'react'
import { socket } from "./services/socket.jsx";
import VideoCall from './pages/VideoCall .jsx';
import Home from './pages/Home.jsx';
import Header from './components/Header.jsx';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Room from './pages/Room.jsx';

import './App.css'

function App() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
   <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meet" element={<VideoCall />} />
        <Route path="/room" element={<Room />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
