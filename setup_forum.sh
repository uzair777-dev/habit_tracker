#!/bin/bash
# Quick setup script to reinitialize database and test forum

echo "🔄 Forum Setup Script"
echo "===================="
echo ""

echo "⚠️  WARNING: This will DELETE all existing database data!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "1️⃣  Stopping any running database processes..."
pkill -f "mariadbd.*3307" || true
sleep 2

echo ""
echo "2️⃣  Removing old database files..."
rm -rf data_p/

echo ""
echo "3️⃣  Starting fresh database (this will run in background)..."
python3 setup_db.py > db_setup.log 2>&1 &
DB_PID=$!
echo "   Database process started (PID: $DB_PID)"

echo ""
echo "   Waiting for database to be ready..."
sleep 5

# Check if database is up
for i in {1..10}; do
    if mysql -h 127.0.0.1 -P 3307 -u root -e "SELECT 1" > /dev/null 2>&1; then
        echo "   ✅ Database is ready!"
        break
    fi
    echo "   Waiting... ($i/10)"
    sleep 2
done

echo ""
echo "4️⃣  Verifying forum tables..."
mysql -h 127.0.0.1 -P 3307 -u root forum_db -e "SHOW TABLES;"

echo ""
echo "5️⃣  Checking forum_messages schema..."
mysql -h 127.0.0.1 -P 3307 -u root forum_db -e "DESCRIBE forum_messages;"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. In a new terminal, start the backend:"
echo "      cd backend && npm start"
echo ""
echo "   2. In another terminal, start the frontend:"
echo "      cd frontend && npm run dev"
echo ""
echo "   3. Test the forum API:"
echo "      cd backend && node test_forum.js"
echo ""
echo "   Database log: db_setup.log"
echo "   Database PID: $DB_PID (to stop: kill $DB_PID)"
echo ""
