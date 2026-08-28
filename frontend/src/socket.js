import { io } from "socket.io-client";
import { Capacitor } from "@capacitor/core";
import { getStoredToken } from "./utils/secureStorage.js";

// socket.io server is attached directly to the backend's http server
// (not under /api — see backend/server.js), so strip a trailing
// "/api" off VITE_API_URL to get the right origin to connect to.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

let socket = null;

// One shared socket for the whole app, created lazily and reused —
// call connectSocket() once auth is confirmed (see App.jsx) and
// disconnectSocket() on logout. Safe to call connectSocket() again
// after a logout -> login (a fresh socket carries the new session's
// auth instead of reusing the stale, disconnected one).
export const connectSocket = async () => {
  if (socket?.connected) return socket;

  // Website: relies on the httpOnly cookie, sent automatically during
  // the handshake because of `withCredentials`. APK: no cookie, so the
  // token from native secure storage is sent explicitly instead — same
  // token the axios interceptor already attaches as a Bearer header.
  const token = Capacitor.isNativePlatform() ? await getStoredToken() : null;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    auth: token ? { token } : {},
    // Backend has no session/sticky-server requirement, but polling
    // fallback is kept (default transports) for networks that block
    // raw websockets — no need to force transports: ["websocket"].
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Components/hooks that just want to listen (not manage the
// connection lifecycle) can grab the current instance — may be null
// if called before connectSocket() has run.
export const getSocket = () => socket;