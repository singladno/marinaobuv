import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Groq Proxy Configuration with Fallback
 * Routes Groq API requests through the proxy server with fallback to direct connection
 */

// Proxy server configuration
const PROXY_CONFIG = {
  // Use localhost for local development, domain for production
  host: process.env.NODE_ENV === 'production' ? 'marina-obuv.ru' : 'localhost',
  port: process.env.NODE_ENV === 'production' ? 443 : 3001,
  protocol: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  path: process.env.NODE_ENV === 'production' ? '/groq-proxy' : '', // Nginx proxy path for production
};

// Check if proxy server is available
export const isProxyAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const proxyUrl = PROXY_CONFIG.port === 443
      ? `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}/healthz`
      : `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}/healthz`;

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
  const proxyUrl = PROXY_CONFIG.port === 443
    ? `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`
    : `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
  return new HttpsProxyAgent(proxyUrl);
};

// Groq configuration with proxy or fallback
export const getGroqConfig = async () => {
  const useProxy = await isProxyAvailable();

  if (useProxy) {
    console.log('🔄 Using Groq proxy server');
    const baseURL = PROXY_CONFIG.port === 443
      ? `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`
      : `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
    return {
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: baseURL,
      timeout: 30000,
      maxRetries: 3,
    };
  } else {
    console.log('⚠️ Proxy server unavailable, using direct Groq connection');
    return {
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com', // Direct connection to Groq
      timeout: 30000,
      maxRetries: 3,
    };
  }
};

// Test Groq connection with fallback
export const testGroqConnection = async () => {
  try {
    console.log('🧪 Testing Groq connection...');

    // First try proxy
    const proxyAvailable = await isProxyAvailable();

    if (proxyAvailable) {
      console.log('🔄 Testing through proxy server...');
      const proxyUrl = PROXY_CONFIG.port === 443
        ? `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`
        : `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;

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
        console.log(
          '❌ Groq API not accessible through proxy:',
          response.status
        );
      }
    }

    // Fallback to direct connection
    console.log('🔄 Testing direct connection to Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Groq API accessible directly!');
      const models = await response.json();
      console.log(`📊 Available models: ${models.data?.length || 0}`);
      return true;
    } else {
      console.log('❌ Groq API not accessible directly:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error);
    return false;
  }
};
