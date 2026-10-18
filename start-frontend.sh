#!/bin/bash

echo "Starting CNC Energy Monitor..."

# Kill existing processes
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

cd "$(dirname "$0")"

# Start vite
echo "Starting Vite server..."
npx vite --host 0.0.0.0 --port 5173 &

echo ""
echo "✅ Frontend starting..."
echo ""
echo "Wait 5 seconds then open: http://localhost:5173"
echo ""
echo "To stop: pkill -f vite"

# Keep script running
wait
