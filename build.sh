#!/usr/bin/env bash
# exit on error
set -e

# Install dependencies
yarn install

# Run prisma generate
yarn prisma generate

# Run prisma migrations
yarn prisma migrate deploy

# Build the application
yarn build



