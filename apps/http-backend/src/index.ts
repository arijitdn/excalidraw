import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SignInSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: parsedData.data.email.toLowerCase(),
        username: parsedData.data.username.toLowerCase(),
        password: parsedData.data.password,
        name: parsedData.data.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    res.json({
      message: "User signed up successfully.",
      user,
    });

    return;
  } catch (error) {
    console.log(error);
    res.status(411).json({
      message: "User already exists with this username/email",
    });

    return;
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });

    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      username: parsedData.data.username,
      password: parsedData.data.password,
    },
  });

  if (!user) {
    res.json({
      message: "Invalid credentials",
    });

    return;
  }

  const token = jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET
  );

  res.json({ token });
});

app.post("/room", authMiddleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });

    return;
  }

  const userId = req.userId;
  try {
    const room = await prisma.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });

    res.json({
      message: `Room created: ${room.id}`,
      roomId: room.id,
    });

    return;
  } catch (error) {
    console.log(error);
    res.json({
      message: "Unexpected error occured.",
    });

    return;
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
