#!/bin/bash
echo "🚀 Starting MarinaObuv locally..."
pm2 start ecosystem.config.js
pm2 logs marinaobuv
