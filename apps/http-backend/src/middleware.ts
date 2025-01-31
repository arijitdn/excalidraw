import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IJWTPayload } from "./types/jwt";
import { JWT_SECRET } from "@repo/backend-common/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, JWT_SECRET) as IJWTPayload;

  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    res.status(403).json({
      message: "Unauthorized",
    });
  }
};
