import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const { password } = req.body as { password?: string; initData?: string };

  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!adminPassword) {
    res.status(500).json({ ok: false, error: "Server misconfigured: ADMIN_PASSWORD not set" });
    return;
  }

  if (!jwtSecret) {
    res.status(500).json({ ok: false, error: "Server misconfigured: JWT_SECRET not set" });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ ok: false, error: "Invalid password" });
    return;
  }

  const token = jwt.sign({ role: "admin", iat: Date.now() }, jwtSecret, {
    expiresIn: "30d",
  });

  res.json({ ok: true, token });
});

export default router;
