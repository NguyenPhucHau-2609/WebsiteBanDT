$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping backend Node processes..."
Get-Process node | Stop-Process -Force

Write-Host "Stopping MongoDB container..."
docker compose down
