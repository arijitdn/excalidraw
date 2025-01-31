import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const PORT = process.env.PORT || 8000;
const wss = new WebSocketServer({ port: PORT as number });

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  if (!decoded && !(decoded as JwtPayload).userId) {
    ws.close();
    return;
  }

  ws.on("message", (data) => {
    if (data.toString().toLowerCase() === "ping") {
      ws.send("Pong!");
    }
  });
});
