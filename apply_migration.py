
import os
import subprocess
import shutil

SCHEMA_PATH = "db/migration_add_habit_fields.sql"
LOG_FILE = "migration_log.txt"

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")
    print(msg)

mysql_client = shutil.which("mysql") or "/usr/bin/mysql"

if os.path.exists(SCHEMA_PATH):
    log("Importing schema migration...")
    try:
        # Check if we can connect safely
        # On MariaDB, root might need sudo if using plugin auth, but we requested normal auth
        # Port 3307 as per setup_db.py
        with open(SCHEMA_PATH, "r") as f:
             subprocess.check_call([mysql_client, "-u", "root", "--port=3307", "-h", "127.0.0.1"], stdin=f, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
             log("Schema imported successfully.")
    except Exception as e:
        log(f"Schema import failed: {e}")
        # Try without password? Or with sudo? Usually root has no password on local dev setup as per setup_db.py logic
        # If it failed, maybe the server is not running?
else:
    log(f"Migration file not found: {SCHEMA_PATH}")
