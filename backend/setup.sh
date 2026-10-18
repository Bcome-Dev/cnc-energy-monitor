#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  CNC Energy Monitor - Setup Script"
echo "════════════════════════════════════════════════════════════"
echo ""

# Stop backend mock jika masih jalan
echo "→ Stopping mock backend..."
pkill -f "index-standalone.js" 2>/dev/null
sleep 2

# Stop frontend jika masih jalan
echo "→ Stopping existing frontend..."
pkill -f "vite" 2>/dev/null
sleep 2

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")"

echo ""
echo "→ Starting Docker containers..."
echo "  (This will prompt for sudo password)"
echo ""

# Start Docker Compose
sudo docker compose up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Docker compose failed to start"
    exit 1
fi

echo ""
echo "→ Waiting for services to be ready..."
sleep 10

# Check container status
echo ""
echo "→ Checking container status..."
sudo docker compose ps

echo ""
echo "→ Testing backend API..."
sleep 3

# Test backend health
HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend API is responding"
    echo "$HEALTH_CHECK" | grep -q '"mqtt":true' && echo "✅ MQTT connected" || echo "⚠️  MQTT not connected yet (may need few seconds)"
    echo "$HEALTH_CHECK" | grep -q '"database":true' && echo "✅ Database connected" || echo "⚠️  Database not connected yet"
else
    echo "⚠️  Backend not responding yet, checking logs..."
    sudo docker compose logs backend | tail -20
fi

echo ""
echo "→ Starting frontend..."
cd ..

# Start frontend in background
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "   Frontend PID: $FRONTEND_PID"
echo "   Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend may still be starting..."
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:3000"
echo "📊 Health:    http://localhost:3000/health"
echo ""
echo "Services running:"
echo "  • PostgreSQL  (port 5432)"
echo "  • Mosquitto   (port 1883)"
echo "  • Backend API (port 3000)"
echo "  • Frontend    (port 5173)"
echo ""
echo "📝 Logs:"
echo "  • Backend:  cd backend && sudo docker compose logs -f backend"
echo "  • Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "  cd backend && sudo docker compose down"
echo "  kill $FRONTEND_PID"
echo ""
echo "════════════════════════════════════════════════════════════"
