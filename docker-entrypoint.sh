#!/bin/sh
set -e

echo "Running Prisma migrations/db push..."
npx prisma db push --skip-generate

echo "Starting CoreHead Backend API on port ${PORT:-5000}..."
exec npm start
