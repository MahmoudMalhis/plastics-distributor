// server/src/server.js
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { ENV } from "./config/env.js";

const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // انضمام المستخدم لغرفته الخاصة
  socket.on("joinUserRoom", ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on("disconnect", () => console.log("socket disconnected:", socket.id));
});

server.listen(ENV.PORT, () => {
  console.log(`API listening on http://localhost:${ENV.PORT}`);
});
