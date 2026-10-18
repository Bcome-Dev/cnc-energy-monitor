#!/bin/bash

echo "Stopping CNC Energy Monitor services..."

# Stop frontend
pkill -f "vite"
echo "✓ Frontend stopped"

# Stop Docker containers
cd "$(dirname "$0")/backend"
sudo docker compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "To remove all data (database): sudo docker compose down -v"
