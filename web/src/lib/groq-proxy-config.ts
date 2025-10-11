import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Groq Proxy Configuration for VPN
 * Routes Groq API requests through the proxy server
 */

// Proxy server configuration
const PROXY_CONFIG = {
  // Your proxy server details
  host: '31.44.2.216',
  port: 8787, // Default port from proxy server
  protocol: 'http',
};

// Create proxy agent for Groq requests
export const createGroqProxyAgent = () => {
  const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
  return new HttpsProxyAgent(proxyUrl);
};

// Groq configuration with proxy
export const getGroqConfig = () => {
  return {
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: `http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`, // Use proxy server directly
    timeout: 30000,
    maxRetries: 3,
  };
};

// Test Groq connection through proxy
export const testGroqConnection = async () => {
  try {
    console.log('🧪 Testing Groq connection through proxy...');

    // Use the proxy server directly with Groq API
    const proxyUrl = `http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;

    const response = await fetch(`${proxyUrl}/openai/v1/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        Host: 'api.groq.com', // Override host header for Groq
      },
    });

    if (response.ok) {
      console.log('✅ Groq API accessible through proxy!');
      const models = await response.json();
      console.log(`📊 Available models: ${models.data?.length || 0}`);
      return true;
    } else {
      console.log('❌ Groq API not accessible:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error);
    return false;
  }
};
