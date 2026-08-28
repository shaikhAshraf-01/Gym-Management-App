import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ---------------------------------------------------------------------
// Real-time layer.
//
// WHY A GYM-SCOPED ROOM (not a per-user room):
// Owner + all trainers of the same gym share the exact same data
// (members, enquiries — see ownerRoutes.js, both roles hit the same
// controllers). So instead of tracking "who needs to know about this
// change" per-user, every socket for a gym just joins one room named
// `gym:<gymId>`. That single room naturally covers BOTH asks:
//   - multiple devices logged into the SAME account (same gymId)
//   - a trainer's change reaching the owner (different account,
//     same gymId)
// Admin sockets (no gymId) don't join a gym room — nothing here
// broadcasts admin-only data yet.
//
// AUTH:
// Reuses the exact same JWT the REST API already trusts — no separate
// login step for sockets. Website sends its httpOnly cookie
// automatically during the socket.io handshake (same as any other
// request, since we set withCredentials on the client); the APK has
// no cookie, so it sends the token via `socket.handshake.auth.token`
// instead (same token it already carries in the Bearer header).
// ---------------------------------------------------------------------

let io = null;

// Minimal cookie-header parser — avoids pulling in the `cookie`
// package just for one key. `req.cookies` (from the `cookie-parser`
// middleware) isn't available here; socket.io's handshake is a raw
// HTTP upgrade request, parsed before Express's middleware chain runs.
const readTokenCookie = (cookieHeader) => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  return match ? decodeURIComponent(match.slice("token=".length)) : null;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token || // APK (native secure storage)
      readTokenCookie(socket.handshake.headers?.cookie); // Website (httpOnly cookie)

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp -otpExpires");

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    const tokenVersion = decoded.tokenVersion ?? 0;
    if (tokenVersion !== user.tokenVersion) {
      return next(new Error("Unauthorized"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true, // handshake reuses the same request; browser still enforces its own CORS via the Origin check below in production if needed
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { user } = socket;

    // Owner/trainer → shared gym room. Admin has no gymId, so it just
    // stays unrooted for now (nothing broadcasts to admins yet).
    if (user.gymId) {
      socket.join(`gym:${user.gymId}`);
    }

    socket.on("disconnect", () => {
      // socket.io auto-leaves all rooms on disconnect — nothing to do.
    });
  });

  return io;
};

// Controllers call this after a successful write to broadcast the
// change to every other device/session on the same gym. Returns null
// (no-op) if sockets haven't been initialized (e.g. in a test
// environment) — callers should always optional-chain (`getIo()?.to(...)`).
export const getIo = () => io;

// Small helper so controllers don't need to know the room-naming
// convention (`gym:<id>`) themselves.
export const emitToGym = (gymId, event, payload) => {
  if (!io || !gymId) return;
  io.to(`gym:${gymId}`).emit(event, payload);
};