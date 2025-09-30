#!/bin/bash

# Temporary SSL setup script
# This creates self-signed certificates for testing

set -e

echo "🔐 Setting up temporary SSL certificates..."

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/marinaobuv.ru.key \
    -out ssl/marinaobuv.ru.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=MarinaObuv/OU=IT/CN=marinaobuv.ru"

echo "✅ SSL certificates created!"
echo "⚠️  These are self-signed certificates - browsers will show security warnings"
echo "For production, use Let's Encrypt or a proper SSL certificate"
