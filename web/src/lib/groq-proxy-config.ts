import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Groq Proxy Configuration with Fallback
 * Routes Groq API requests through the proxy server with fallback to direct connection
 */

// Proxy server configuration
const PROXY_CONFIG = {
  // Use domain instead of direct IP (server is behind load balancer)
  host: 'marina-obuv.ru',
  port: 443, // Use HTTPS port
  protocol: 'https',
  path: '/groq-proxy', // Nginx proxy path
};

// Check if proxy server is available
export const isProxyAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}/healthz`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Proxy server not available:', error);
    return false;
  }
};

// Create proxy agent for Groq requests
export const createGroqProxyAgent = () => {
  const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`;
  return new HttpsProxyAgent(proxyUrl);
};

// Groq configuration with proxy or fallback
export const getGroqConfig = async () => {
  const useProxy = await isProxyAvailable();

  if (useProxy) {
    console.log('🔄 Using Groq proxy server');
    return {
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`, // Use proxy server through domain
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
      const proxyUrl = `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.host}${PROXY_CONFIG.path}`;

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
