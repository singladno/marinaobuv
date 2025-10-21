import "dotenv/config";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

const app = express();
const PORT = process.env.PORT || 3001;
const TARGET = process.env.PROXY_TARGET || "https://api.groq.com";
const UPSTREAM = process.env.UPSTREAM_PROXY; // e.g. http://user:pass@host:port

// Trust proxy for proper rate limiting behind nginx
app.set("trust proxy", 1);

// Allow common OpenAI endpoints even if client baseURL already includes /v1
const DEFAULT_ALLOWED = [
  "/openai",
  "/v1",
  "/chat",
  "/responses",
  "/images",
  "/embeddings",
  "/audio",
  "/fine_tuning",
  "/models",
];

// Parse allowed prefixes from environment or use defaults
const allowedPrefixes = process.env.ALLOWED_PREFIXES
  ? process.env.ALLOWED_PREFIXES.split(",").map((p) => p.trim())
  : DEFAULT_ALLOWED;

console.log("Allowed prefixes:", allowedPrefixes);

// Rate limiting with proper proxy configuration
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    trustProxy: true,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Logging
app.use(morgan("combined"));

// Health check endpoint
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    target: TARGET,
    upstream: !!UPSTREAM,
  });
});

// Path validation middleware
app.use((req, res, next) => {
  const path = req.path;
  const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));

  if (!isAllowed) {
    return res.status(403).json({
      error: "Path not allowed",
      path: path,
      allowed: allowedPrefixes,
    });
  }

  next();
});

// Create proxy agents if upstream proxy is configured
let agent = null;
if (UPSTREAM) {
  const Agent = UPSTREAM.startsWith("https") ? HttpsProxyAgent : HttpProxyAgent;
  agent = new Agent(UPSTREAM);
  console.log("Using upstream proxy:", UPSTREAM);
}

// Proxy middleware
app.use(
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    agent: agent,
    onError: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(502).json({ error: "Bad Gateway" });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Set proper headers for Groq API
      proxyReq.setHeader("Host", "api.groq.com");
      console.log(`Proxying ${req.method} ${req.path} to ${TARGET}`);
    },
  })
);

// Start server
app.listen(PORT, () => {
  console.log(
    `OpenAI proxy listening on http://localhost:${PORT} -> ${TARGET}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
