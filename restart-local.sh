#!/bin/bash
echo "🔄 Restarting MarinaObuv..."
pm2 restart marinaobuv
pm2 logs marinaobuv
