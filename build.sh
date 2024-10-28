#!/bin/bash
set -e

echo "Installing dependencies..."
yarn install

echo "Generating Prisma Client..."
yarn prisma generate

echo "Running database migrations..."
yarn prisma migrate deploy

echo "Building application..."
# Use local nest CLI
yarn run build
