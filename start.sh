#!/bin/bash

# Exit on error
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
VENV_PYTHON="/Users/zaidfaridi/.venvs/pcos-ai/bin/python"

echo "🌸 Starting SHEra PCOS/PCOD AI Platform..."

# 1. Start AI Inference Engine (Python Flask - Port 5000)
echo "🧠 Starting Python AI Engine on http://localhost:5000..."
cd "$DIR/pcos-pcod-ai-project"
$VENV_PYTHON app.py &
PID_AI=$!

# 2. Start Application Server (Node.js/Express - Port 5001)
echo "💾 Starting Node.js Backend on http://localhost:5001..."
cd "$DIR/backend"
node server.js &
PID_BACKEND=$!

# 3. Start Frontend Client (Vite React - Port 5173)
echo "🎨 Starting Frontend Client on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev -- --host &
PID_FRONTEND=$!

# Trap SIGINT / SIGTERM to gracefully shut down all services
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $PID_AI $PID_BACKEND $PID_FRONTEND 2>/dev/null || true
    wait $PID_AI $PID_BACKEND $PID_FRONTEND 2>/dev/null || true
    echo "👋 All services stopped."
}

trap cleanup INT TERM

echo ""
echo "✨ SHEra is fully running!"
echo "➡️  Frontend:    http://localhost:5173"
echo "➡️  Node API:    http://localhost:5001"
echo "➡️  AI Engine:   http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for any process to exit
wait
