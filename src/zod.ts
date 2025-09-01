import {z} from "zod"
import { Role } from "../src/generated/prisma"

export const createUserSchema = z.object({
    name: z.string().min(3),
    username: z.string().min(4).max(30),
    password: z.string(),
    role: z.enum(Role)
})

export const signinSchema = z.object({
    username: z.string().min(4).max(30),
    password: z.string()
})
