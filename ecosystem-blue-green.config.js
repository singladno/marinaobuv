module.exports = {
  apps: [
    {
      name: "marinaobuv-blue",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        DEPLOYMENT_COLOR: "blue",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        DEPLOYMENT_COLOR: "blue",
      },
      // Logging configuration
      log_file: "./logs/marinaobuv-blue.log",
      out_file: "./logs/marinaobuv-blue-out.log",
      error_file: "./logs/marinaobuv-blue-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Performance and memory management
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=2048",

      // Process management
      watch: false,
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
    {
      name: "marinaobuv-green",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
        DEPLOYMENT_COLOR: "green",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
        DEPLOYMENT_COLOR: "green",
      },
      // Logging configuration
      log_file: "./logs/marinaobuv-green.log",
      out_file: "./logs/marinaobuv-green-out.log",
      error_file: "./logs/marinaobuv-green-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Performance and memory management
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=2048",

      // Process management
      watch: false,
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
  ],
};
