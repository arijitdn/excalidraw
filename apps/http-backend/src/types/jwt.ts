import { JwtPayload } from "jsonwebtoken";

export interface IJWTPayload extends JwtPayload {
  userId: string;
}
