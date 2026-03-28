$ErrorActionPreference = "Stop"

Write-Host "Starting MongoDB with Docker..."
docker compose up -d

Write-Host "Seeding database..."
npm run seed

Write-Host "Starting backend on http://localhost:5000 ..."
npm run dev
