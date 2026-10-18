#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  CNC Energy Monitor - Starting (No Docker Required)"
echo "════════════════════════════════════════════════════════════"
echo ""

# Stop existing processes
echo "→ Stopping existing services..."
pkill -f "index-standalone.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

cd "$(dirname "$0")/backend"

echo "→ Starting Backend API..."
nohup node src/index-standalone.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

sleep 3

# Check backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend API started"
else
    echo "❌ Backend failed to start"
    exit 1
fi

cd ..

echo ""
echo "→ Starting Frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 5

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend started"
else
    echo "⚠️  Frontend still starting..."
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ CNC Energy Monitor is Running!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Buka browser: http://localhost:5173"
echo ""
echo "📊 Services:"
echo "   • Backend API: http://localhost:3000"
echo "   • Frontend:    http://localhost:5173"
echo "   • Mode:        Standalone (Mock Data)"
echo ""
echo "📝 Logs:"
echo "   • Backend:  tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop:"
echo "   • ./stop.sh"
echo "   • atau: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "⚠️  Note: Data menggunakan simulasi (mock)"
echo "   Untuk data real ESP32, jalankan:"
echo "   cd backend && sudo docker compose up -d"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Backend PID: $BACKEND_PID" > .pids
echo "Frontend PID: $FRONTEND_PID" >> .pids
