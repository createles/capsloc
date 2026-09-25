#!/bin/sh
set -e

echo "🚀 [CapsLoc] Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "🌱 [CapsLoc] Seeding showroom datasets..."
./node_modules/.bin/prisma db seed

echo "🎮 [CapsLoc] Starting NestJS Production Server on port ${PORT:-3000}..."
exec node dist/main.js
