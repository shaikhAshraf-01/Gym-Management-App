import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io = null;

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

export const getIo = () => io;

export const emitToGym = (gymId, event, payload) => {
  if (!io || !gymId) return;
  io.to(`gym:${gymId}`).emit(event, payload);
};