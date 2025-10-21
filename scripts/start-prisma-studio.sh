#!/bin/bash

echo "Starting Prisma Studio on server..."
ssh ubuntu@130.193.56.134 'cd /var/www/marinaobuv/web && export $(grep -v "^#" .env | xargs) && pkill -f "prisma studio" || true && echo "Starting Prisma Studio..." && nohup npx prisma studio --port 5555 --browser none >/dev/null 2>&1 & sleep 15 && ss -ltnp | grep :5555 && echo "Prisma Studio started on localhost:5555" || echo "Failed to start Prisma Studio"'

echo "Opening SSH tunnel to localhost:5555..."
echo "Once connected, open http://localhost:5555 in your browser"
echo "Press Ctrl+C to stop the tunnel"
ssh -N -L 5555:localhost:5555 ubuntu@130.193.56.134
