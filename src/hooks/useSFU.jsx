import * as mediasoupClient from "mediasoup-client";
import { socket } from "../services/socket";

const peerStreams = new Map();          // peerId -> MediaStream
const consumedProducers = new Set();   // producerId guard

export function useSFU(roomId, onRemoteStream) {
  let device;
  let sendTransport;
  let recvTransport;
  let localStream;

  let started = false;
  let hasProduced = false;
  let listenersAttached = false;

  const start = async (localVideoRef) => {
    if (started) {
      console.warn("⚠️ start() already called, skipping");
      return;
    }
    started = true;

    console.log("🚀 START SFU for room:", roomId);

    /* ---------- JOIN ROOM ---------- */
    const { rtpCapabilities, existingProducers } =
      await new Promise(res =>
        socket.emit("join-room", { roomId }, res)
      );

    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    console.log("📡 DEVICE LOADED");

    /* ---------- GET LOCAL MEDIA ---------- */
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    if (localVideoRef?.current) {
      localVideoRef.current.srcObject = localStream;
    }

    /* ---------- SEND TRANSPORT ---------- */
    const sendData = await new Promise(res =>
      socket.emit("create-transport", { direction: "send" }, res)
    );

    sendTransport = device.createSendTransport(sendData);

    sendTransport.on("connect", ({ dtlsParameters }, cb) => {
      socket.emit("connect-transport", {
        transportId: sendTransport.id,
        dtlsParameters
      });
      cb();
    });

    sendTransport.on("produce", ({ kind, rtpParameters }, cb) => {
      socket.emit(
        "produce",
        { transportId: sendTransport.id, kind, rtpParameters },
        ({ id }) => cb({ id })
      );
    });

    if (!hasProduced) {
      localStream.getTracks().forEach(track => {
        sendTransport.produce({ track });
      });
      hasProduced = true;
    }

    /* ---------- RECV TRANSPORT ---------- */
    const recvData = await new Promise(res =>
      socket.emit("create-transport", { direction: "recv" }, res)
    );

    recvTransport = device.createRecvTransport(recvData);

    recvTransport.on("connect", ({ dtlsParameters }, cb) => {
      socket.emit("connect-transport", {
        transportId: recvTransport.id,
        dtlsParameters
      });
      cb();
    });

    /* ---------- SOCKET LISTENERS (ONCE) ---------- */
    if (!listenersAttached) {
      listenersAttached = true;

      socket.on("new-producer", async ({ producerId, peerId, kind }) => {
        console.log("🆕 NEW PRODUCER", { producerId, peerId, kind });
        await consume(producerId);
      });

      socket.on("peer-left", ({ peerId }) => {
        peerStreams.delete(peerId);
        onRemoteStream(null, peerId);
      });
    }

    /* ---------- CONSUME EXISTING ---------- */
    for (const producerId of existingProducers) {
      await consume(producerId);
    }
  };

  /* ---------- CONSUME ---------- */
  const consume = async (producerId) => {
    // 🔒 Guards
    if (!device || !recvTransport) {
      console.warn("⛔ consume skipped — device/transport not ready");
      return;
    }

    if (consumedProducers.has(producerId)) {
      console.warn("⛔ producer already consumed", producerId);
      return;
    }
    consumedProducers.add(producerId);

    const data = await new Promise(res =>
      socket.emit(
        "consume",
        { producerId, rtpCapabilities: device.rtpCapabilities },
        res
      )
    );

    if (!data) return;

    const consumer = await recvTransport.consume({
      id: data.id,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters
    });

    await consumer.resume();

    let stream = peerStreams.get(data.peerId);
    if (!stream) {
      stream = new MediaStream();
      peerStreams.set(data.peerId, stream);
    }

    stream.addTrack(consumer.track);

    console.log("✅ TRACK ADDED", {
      peerId: data.peerId,
      tracks: stream.getTracks().map(t => t.kind)
    });
    await consumer.resume();
    onRemoteStream(stream, data.peerId);
  };

  return {
    start,
    getLocalStream: () => localStream
  };
}
