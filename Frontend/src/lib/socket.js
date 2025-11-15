import { io } from "socket.io-client";

// === FINAL, WORKING SOCKET FACTORY ===
export function createSocket() {
  const token = localStorage.getItem("token");

  const socket = io("https://backend-3ex6nbvuga-el.a.run.app", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    reconnectionDelayMax: 2000,
    timeout: 5000
  });

  return socket;
}

// === SAFE TOKEN DECODER ===
export function decodeUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || payload._id || null;
  } catch {
    return null;
  }
}
