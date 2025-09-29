#!/bin/bash

# Read Node.js version from .nvmrc file
NODE_VERSION=$(cat .nvmrc | tr -d '\n')

echo "Building Docker image with Node.js version: $NODE_VERSION"

# Build the Docker image with the Node.js version from .nvmrc
docker build \
  --build-arg NODE_VERSION="$NODE_VERSION" \
  -f Dockerfile.prod \
  -t marinaobuv:latest \
  .

echo "Build completed!"
