import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

const ICE_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function useWebRTC(roomId) {
    const localVideoRef = useRef(null);
    const peers = useRef({});
    const [localStream, setLocalStream] = useState(null);
    const [streams, setStreams] = useState([]);
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function start() {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if (!mounted) return;

            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setStreams([{ id: "local", stream }]);
            setActiveId("local");

            socket.emit("join-room", { roomId });

            socket.on("user-joined", async (id) => {
                const pc = createPeer(id, stream);
                peers.current[id] = pc;

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("offer", { to: id, offer });
            });

            socket.on("offer", async ({ from, offer }) => {
                const pc = createPeer(from, stream);
                peers.current[from] = pc;

                await pc.setRemoteDescription(offer);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("answer", { to: from, answer });
            });

            socket.on("answer", ({ from, answer }) => {
                peers.current[from]?.setRemoteDescription(answer);
            });

            socket.on("ice-candidate", ({ from, candidate }) => {
                peers.current[from]?.addIceCandidate(candidate);
            });

            // socket.on("user-left", (id) => {
            //     peers.current[id]?.close();
            //     delete peers.current[id];
            //     setStreams((prev) => prev.filter((s) => s.id !== id));
            // });

            socket.on("user-left", (id) => {
                console.log('73======>',id);
                if (peers.current[id]) {
                    peers.current[id].close();
                    delete peers.current[id];
                }

                setStreams(prev => prev.filter(s => s.id !== id));

                // 🔥 FIX ACTIVE SCREEN
                setActiveId(prev =>
                    prev === id ? "local" : prev
                );
            });

        }

        start();

        // return () => {
        //   mounted = false;
        //   socket.off("user-joined");
        //   socket.off("offer");
        //   socket.off("answer");
        //   socket.off("ice-candidate");
        //   socket.off("user-left");
        // };


        return () => {
            mounted = false;

            // 🔥 Inform server
            socket.emit("leave-room", { roomId });

            // 🔥 Close all peer connections
            Object.values(peers.current).forEach(pc => pc.close());
            peers.current = {};

            // 🔥 Stop media tracks
            localStream?.getTracks().forEach(track => track.stop());

            // 🔥 Clear UI
            setStreams([]);
            setActiveId(null);

            socket.removeAllListeners();
        };

    }, [roomId]);

    function createPeer(id, stream) {
        const pc = new RTCPeerConnection(ICE_CONFIG);

        stream.getTracks().forEach((track) =>
            pc.addTrack(track, stream)
        );

        pc.ontrack = (event) => {
            setStreams((prev) => {
                if (prev.find((s) => s.id === id)) return prev;
                return [...prev, { id, stream: event.streams[0] }];
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    to: id,
                    candidate: event.candidate
                });
            }
        };

        return pc;
    }

    return {
        localVideoRef,
        localStream,
        streams,
        activeId,
        setActiveId
    };
}
