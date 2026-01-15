#!/bin/bash
echo "1. Fetch empty:"
curl -s "http://localhost:4000/api/habits?userId=verify_user"
echo -e "\n\n2. Add Habit:"
curl -s -X POST -H "Content-Type: application/json" -d '{"userId":"verify_user", "name":"Verify Habit"}' "http://localhost:4000/api/habits"
echo -e "\n\n3. Fetch (should have 1):"
RESP=$(curl -s "http://localhost:4000/api/habits?userId=verify_user")
echo $RESP
HABIT_ID=$(echo $RESP | grep -o '"id":[^,]*' | cut -d: -f2)
echo -e "\nHabit ID: $HABIT_ID"

echo -e "\n\n4. Toggle (Check):"
curl -s -X POST -H "Content-Type: application/json" -d '{"userId":"verify_user"}' "http://localhost:4000/api/habits/$HABIT_ID/toggle"

echo -e "\n\n5. Fetch (should be completed):"
curl -s "http://localhost:4000/api/habits?userId=verify_user"
echo ""
