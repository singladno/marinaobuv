module.exports = {
  apps: [
    {
      name: "groq-sequential",
      script: "npx",
      args: "tsx src/scripts/groq-sequential-cron.ts",
      cwd: "./web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        GROQ_API_KEY: process.env.GROQ_API_KEY,
      },
      env_production: {
        NODE_ENV: "production",
        GROQ_API_KEY: process.env.GROQ_API_KEY,
      },
      // Logging configuration
      log_file: "./logs/groq-sequential.log",
      out_file: "./logs/groq-sequential-out.log",
      error_file: "./logs/groq-sequential-error.log",
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
      autorestart: false, // Don't auto-restart parser - run once and exit
      max_restarts: 0,
      min_uptime: "10s",

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
  ],
};
