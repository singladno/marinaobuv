import { HttpsProxyAgent } from 'https-proxy-agent';
import 'dotenv/config';

/**
 * Groq Proxy Configuration
 * Routes Groq API requests through the proxy server only - no fallback
 */

// Proxy server configuration
const PROXY_CONFIG = {
  // Always use serverspace server for proxy connection
  host: '31.44.2.216',
  port: 8787,
  protocol: 'http',
  path: '', // Direct connection to proxy server
};

// Check if proxy server is available
export const isProxyAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}${PROXY_CONFIG.path}/healthz`;

    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Proxy server not available:', error);
    return false;
  }
};

// Create proxy agent for Groq requests
export const createGroqProxyAgent = () => {
  const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}${PROXY_CONFIG.path}`;
  return new HttpsProxyAgent(proxyUrl);
};

// Groq configuration - proxy only, no fallback
export const getGroqConfig = async () => {
  const useProxy = await isProxyAvailable();

  if (!useProxy) {
    throw new Error(
      '❌ Groq proxy server is unavailable. Cannot proceed without proxy connection.'
    );
  }

  console.log('🔄 Using Groq proxy server');
  // Groq SDK appends /openai/v1 automatically, so baseURL should be just the proxy server
  const baseURL = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}${PROXY_CONFIG.path}`;

  return {
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: baseURL,
    timeout: 30000,
    maxRetries: 3,
  };
};

// Test Groq connection through proxy only
export const testGroqConnection = async () => {
  try {
    console.log('🧪 Testing Groq connection through proxy...');

    const proxyAvailable = await isProxyAvailable();

    if (!proxyAvailable) {
      throw new Error(
        '❌ Groq proxy server is unavailable. Cannot test connection.'
      );
    }

    console.log('🔄 Testing through proxy server...');
    const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}${PROXY_CONFIG.path}`;

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
      console.log('❌ Groq API not accessible through proxy:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      throw new Error(
        `Groq API not accessible through proxy: ${response.status}`
      );
    }
  } catch (error) {
    console.log('❌ Connection failed:', error);
    throw error;
  }
};
