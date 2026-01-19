#!/bin/bash
# Database Migration Script for Habit Scheduling Feature

echo "🔄 Habit Tracker - Database Migration Script"
echo "============================================="
echo ""
echo "This script will:"
echo "1. Reset the database with new schema (schedule columns)"
echo "2. You'll need to restart backend and frontend after this"
echo ""
read -p "⚠️  This will DELETE all existing habit data! Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Migration cancelled."
    exit 1
fi

echo ""
echo "📦 Removing old database..."
rm -rf data_p/

echo "✅ Old database removed"
echo ""
echo "🚀 Starting new database with updated schema..."
python3 setup_db.py &
DB_PID=$!

# Wait for database to be ready
echo "⏳ Waiting for database to start..."
sleep 5

echo ""
echo "✅ Database migration complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Terminal 1 (this one): Database is running"
echo "    Leave this terminal open"
echo ""
echo "2️⃣  Terminal 2: Start Backend"
echo "    cd backend"
echo "    npm start"
echo ""
echo "3️⃣  Terminal 3: Start Frontend"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "4️⃣  Open browser to: http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Enjoy your new habit scheduling features!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running to show database logs
wait $DB_PID
