import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface UserPayload {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies?.token) {
    return res.status(403).send({ errors: { msg: "Token not provided" } });
  }

  try {
    const payload = jwt.verify(
      req.cookies.token,
      process.env.JWT_KEY!
    ) as UserPayload;
    req.currentUser = payload;
    next();
  } catch (err) {
    console.log("AUTH ERR");
    return res.status(403).send({ errors: { msg: "Invalid token" } });
  }
};
