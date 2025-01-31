import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().max(20),
  username: z.string().min(3).max(10),
  email: z.string().email(),
  password: z.string().min(6).max(15),
});

export const SignInSchema = z.object({
  username: z.string().min(3).max(10),
  password: z.string().min(6).max(15),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
});
