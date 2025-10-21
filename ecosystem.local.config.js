module.exports = {
  apps: [
    {
      name: "marinaobuv-local",
      script: "web/server.js",
      cwd: "./web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_local: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Local development specific settings
      watch: false,
      ignore_watch: ["node_modules", "logs", "backups"],
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      // Restart settings
      min_uptime: "10s",
      max_restarts: 10,
      // Local development optimizations
      node_args: "--max-old-space-size=2048",
    },
  ],
};
