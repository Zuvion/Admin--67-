import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_TELEGRAM_ID = 5394437781;

function verifyTelegramInitData(
  initData: string,
  botToken: string,
): { valid: boolean; userId?: number } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return { valid: false };

    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secret = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) return { valid: false };

    const userStr = params.get("user");
    if (!userStr) return { valid: false };

    const user = JSON.parse(userStr) as { id?: number };
    return { valid: true, userId: user.id };
  } catch {
    return { valid: false };
  }
}

router.post("/auth/login", async (req, res) => {
  const { initData } = req.body as { initData?: string };

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!botToken) {
    res.status(500).json({
      ok: false,
      error: "Server misconfigured: TELEGRAM_BOT_TOKEN not set",
    });
    return;
  }

  if (!jwtSecret) {
    res.status(500).json({
      ok: false,
      error: "Server misconfigured: JWT_SECRET not set",
    });
    return;
  }

  if (!initData) {
    res.status(401).json({ ok: false, error: "initData required" });
    return;
  }

  const { valid, userId } = verifyTelegramInitData(initData, botToken);

  if (!valid) {
    res.status(401).json({ ok: false, error: "Неверные данные Telegram" });
    return;
  }

  if (userId !== ADMIN_TELEGRAM_ID) {
    res.status(403).json({ ok: false, error: "Доступ запрещён" });
    return;
  }

  const token = jwt.sign(
    { role: "admin", telegramId: userId },
    jwtSecret,
    { expiresIn: "30d" },
  );

  res.json({ ok: true, token });
});

export default router;
