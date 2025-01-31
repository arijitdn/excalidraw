import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

const PORT = process.env.PORT || 8000;
const wss = new WebSocketServer({ port: PORT as number });

interface IUser {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: IUser[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded && !(decoded as JwtPayload).userId) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";
  const userId = checkUser(token);

  if (userId === null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async (data) => {
    const parsedData = JSON.parse(data.toString());

    if (parsedData.type === "join_room") {
      const user = users.find((u) => u.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((u) => u.ws === ws);
      if (!user) return;
      user.rooms = user.rooms.filter((r) => r !== parsedData.roomId);
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      try {
        await prisma.chat.create({
          data: {
            roomId,
            userId,
            message,
          },
        });

        users.forEach((u) => {
          if (u.rooms.includes(roomId)) {
            u.ws.send(
              JSON.stringify({
                type: "chat",
                message,
                roomId,
              })
            );
          }
        });
      } catch (error) {
        ws.send(
          JSON.stringify({
            error: true,
            message: "Invalid room id",
          })
        );
        return;
      }
    }
  });
});
