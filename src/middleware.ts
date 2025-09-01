
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!

declare global {
  namespace Express {
    export interface Request {
      userId: string;
    }
  }
}
export default  function middleware(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const token = req.headers["authorization"] ?? ""

   try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "object" && "userId" in decoded) {
      req.userId = (decoded as JwtPayload).userId as string;
      return next();
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
