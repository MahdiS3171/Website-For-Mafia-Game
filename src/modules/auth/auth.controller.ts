import { Request, Response } from "express";
import { login } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const token = await login(username, password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}
