#!/bin/bash

echo "Installing dependencies..."
yarn install

echo "Installing additional dependencies..."
yarn add nodemailer googleapis handlebars @types/nodemailer

echo "Generating Prisma client..."
yarn prisma generate

echo "Building application..."
yarn build



