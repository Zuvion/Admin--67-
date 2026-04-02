import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const ADMIN_TELEGRAM_ID = 5394437781;

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!jwtSecret) {
    res.status(500).json({ ok: false, error: "Server misconfigured" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      role?: string;
      telegramId?: number;
    };

    // Жёсткая проверка: только admin с нужным Telegram ID
    if (decoded.telegramId !== ADMIN_TELEGRAM_ID) {
      res.status(403).json({ ok: false, error: "Access denied" });
      return;
    }

    next();
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}

async function proxyRequest(req: Request, res: Response): Promise<void> {
  const cryptexaApiUrl = process.env.CRYPTEXA_API_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!cryptexaApiUrl || !adminApiKey) {
    res.status(500).json({
      ok: false,
      error: "Server misconfigured: CRYPTEXA_API_URL or ADMIN_API_KEY not set",
    });
    return;
  }

  const targetPath = "/api/admin" + req.path;
  const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = cryptexaApiUrl.replace(/\/$/, "") + targetPath + queryString;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Admin-API-Key": adminApiKey,
  };

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get("content-type") || "";

    res.status(response.status);

    if (contentType.includes("application/json")) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.type("text").send(text);
    }
  } catch {
    res.status(502).json({
      ok: false,
      error: "Failed to connect to CRYPTEXA backend",
    });
  }
}

router.use("/admin", requireAuth, async (req: Request, res: Response) => {
  await proxyRequest(req, res);
});

export default router;
