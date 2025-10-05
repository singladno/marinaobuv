import "dotenv/config";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

const app = express();
const PORT = process.env.PORT || 8787;
const TARGET = process.env.PROXY_TARGET || "https://api.openai.com";
const UPSTREAM = process.env.UPSTREAM_PROXY; // e.g. http://user:pass@host:port
// Allow common OpenAI endpoints even if client baseURL already includes /v1
const DEFAULT_ALLOWED = [
  "/v1",
  "/chat",
  "/responses",
  "/images",
  "/embeddings",
  "/audio",
  "/fine_tuning",
  "/models",
];

const ALLOWED = (process.env.ALLOWED_PREFIXES || DEFAULT_ALLOWED.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// базовый лимит чтобы не словить блоки
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// не логируем заголовок Authorization
app.use(
  morgan(":method :url :status :response-time ms", {
    skip: (req) => !!req.headers.authorization,
  })
);

app.get("/healthz", (_, res) =>
  res.json({ ok: true, target: TARGET, upstream: !!UPSTREAM })
);

// фильтр маршрутов — пропускаем только /v1...
app.use((req, res, next) => {
  // Normalize multiple slashes and ensure leading slash
  const urlPath = (req.url || "").replace(/\/+/, "/");
  if (!ALLOWED.some((p) => urlPath.startsWith(p))) {
    return res.status(403).json({ error: "Path not allowed" });
  }
  next();
});

// сам прокси
// For HTTPS target (OpenAI), we must tunnel via CONNECT even if the upstream is an HTTP proxy.
// So always use HttpsProxyAgent when UPSTREAM is provided.
const agent = (() => {
  if (!UPSTREAM) return undefined;
  try {
    return new HttpsProxyAgent(new URL(UPSTREAM));
  } catch {
    return undefined;
  }
})();

app.use(
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    ws: false,
    agent, // forward via upstream if provided
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("Host", new URL(TARGET).host);
    },
  })
);

app.listen(PORT, () => {
  console.log(
    `OpenAI proxy listening on http://localhost:${PORT} -> ${TARGET}`
  );
});
