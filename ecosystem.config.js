module.exports = {
  apps: [
    {
      name: "marinaobuv",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        // Environment variables will be loaded from .env
        // Make sure to set SMS_API_KEY in your production environment
      },
      // Logging configuration
      log_file: "./logs/marinaobuv.log",
      out_file: "./logs/marinaobuv-out.log",
      error_file: "./logs/marinaobuv-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Performance and memory management
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=2048",

      // Process management
      watch: process.env.NODE_ENV === "development",
      ignore_watch: ["node_modules", "logs", ".next", "*.log"],
      restart_delay: 5000,
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Advanced PM2 features
      autorestart: true,
      max_restarts: 5,
      min_uptime: "30s",

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
    // prisma-studio is disabled in production to conserve resources
  ],
};
