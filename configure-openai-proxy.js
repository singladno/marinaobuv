// OpenAI Proxy Configuration for VPN
// This script configures your application to route OpenAI requests through VPN

const https = require("https");
const http = require("http");

// VPN Configuration
const VPN_CONFIG = {
  // WireGuard interface (adjust if different)
  interface: "wg0",
  // OpenAI API endpoints that need VPN routing
  openaiEndpoints: ["api.openai.com", "api.openai.com:443"],
};

// Proxy configuration for OpenAI requests
const createProxyAgent = (targetHost, targetPort = 443) => {
  return new https.Agent({
    // Route through WireGuard interface
    // This ensures OpenAI requests go through VPN
    createConnection: (options, callback) => {
      const socket = require("net").createConnection({
        host: targetHost,
        port: targetPort,
        // Force routing through VPN interface
        localAddress: "10.0.0.2", // Your WireGuard client IP
      });

      socket.on("connect", () => {
        callback(null, socket);
      });

      socket.on("error", (err) => {
        callback(err);
      });
    },
  });
};

// OpenAI API configuration with VPN routing
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  // Use proxy agent for all requests
  httpsAgent: createProxyAgent("api.openai.com", 443),
  // Additional configuration
  timeout: 30000,
  maxRetries: 3,
};

// Test OpenAI connection through VPN
const testOpenAIConnection = async () => {
  try {
    console.log("🧪 Testing OpenAI connection through VPN...");

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      // Use proxy agent
      agent: createProxyAgent("api.openai.com", 443),
    });

    if (response.ok) {
      console.log("✅ OpenAI API accessible through VPN!");
      const models = await response.json();
      console.log(`📊 Available models: ${models.data.length}`);
    } else {
      console.log("❌ OpenAI API not accessible:", response.status);
    }
  } catch (error) {
    console.log("❌ Connection failed:", error.message);
  }
};

// Route OpenAI requests through VPN
const routeOpenAIThroughVPN = () => {
  console.log("🔧 Configuring OpenAI requests to use VPN...");

  // Override fetch for OpenAI requests
  const originalFetch = global.fetch;
  global.fetch = (url, options = {}) => {
    // Check if it's an OpenAI API request
    if (url.includes("api.openai.com")) {
      console.log("🌐 Routing OpenAI request through VPN...");

      // Add proxy agent to options
      options.agent = createProxyAgent("api.openai.com", 443);
    }

    return originalFetch(url, options);
  };

  console.log("✅ OpenAI routing configured!");
};

module.exports = {
  createProxyAgent,
  openaiConfig,
  testOpenAIConnection,
  routeOpenAIThroughVPN,
};

// Auto-configure if running directly
if (require.main === module) {
  routeOpenAIThroughVPN();
  testOpenAIConnection();
}
