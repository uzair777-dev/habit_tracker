
import os
import subprocess
import sys
import shutil
import time

LOG_FILE = os.path.abspath("setup_log.txt")

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")
    print(msg)

log("Starting DB Setup (MariaDB aware)")

# Kill existing process on port 3307 if any
log("Checking for existing server on port 3307...")
try:
    subprocess.call(["pkill", "-f", "port=3307"])
    time.sleep(2) # Give it time to die
except Exception as e:
    log(f"pkill failed: {e}")

# Clean up failed dir
data_dir = os.path.abspath("data_p")
if os.path.exists(data_dir):
    shutil.rmtree(data_dir)
os.makedirs(data_dir)

mysqld_path = shutil.which("mysqld")
if not mysqld_path: 
    mysqld_path = "/usr/bin/mysqld"

mysql_install_db = shutil.which("mariadb-install-db") or shutil.which("mysql_install_db")

# Fallback search
if not mysql_install_db:
    candidates = [
        "/usr/bin/mysql_install_db",
        "/usr/bin/mariadb-install-db",
        "/usr/libexec/mariadb-install-db", 
        "/usr/local/bin/mysql_install_db"
    ]
    for c in candidates:
        if os.path.exists(c):
            mysql_install_db = c
            break

log(f"mysqld: {mysqld_path}")
log(f"install_db: {mysql_install_db}")

if mysql_install_db:
    log(f"Initializing data dir: {data_dir}")
    # MariaDB install
    cmd = [
        mysql_install_db, 
        f"--datadir={data_dir}", 
        "--auth-root-authentication-method=normal",
        "--skip-test-db"
    ]
    try:
        subprocess.check_call(cmd, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
    except Exception as e:
        log(f"mysql_install_db failed: {e}")
        # Try mysqld --initialize as fallback (MySQL 5.7/8.0)
        cmd2 = [mysqld_path, "--initialize-insecure", f"--datadir={data_dir}"]
        try:
             subprocess.check_call(cmd2, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
        except Exception as e2:
             log(f"mysqld --initialize failed too: {e2}")

else:
    log("Could not find invalid_db tool, trying mysqld --initialize")
    cmd = [mysqld_path, "--initialize-insecure", f"--datadir={data_dir}"]
    try:
        subprocess.check_call(cmd, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
    except Exception as e:
        log(f"Init failed: {e}")

# Start server
log("Starting server on port 3307...")
socket_path = os.path.join(data_dir, "mysql.sock")
pid_path = os.path.join(data_dir, "mysqld.pid")

# MariaDB specific args might be needed, but usually mysqld accepts these
cmd = [
    mysqld_path,
    f"--datadir={data_dir}",
    "--port=3307",
    f"--socket={socket_path}",
    f"--pid-file={pid_path}",
    "--bind-address=127.0.0.1"
]

proc = subprocess.Popen(cmd, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
log(f"Server process started. PID: {proc.pid}")

time.sleep(10)

if proc.poll() is not None:
    log("Server exited early. Check logs.")
    sys.exit(1)

log("Server seems up.")

# Import schema
schema_path = "db/schema.sql"
mysql_client = shutil.which("mysql") or "/usr/bin/mysql"

if os.path.exists(schema_path):
    log("Importing schema...")
    try:
        # Check if we can connect safely
        # On MariaDB, root might need sudo if using plugin auth, but we requested normal auth
        with open(schema_path, "r") as f:
             subprocess.check_call([mysql_client, "-u", "root", "--port=3307", "-h", "127.0.0.1"], stdin=f, stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
             log("Schema imported successfully.")
    except Exception as e:
        log(f"Schema import failed: {e}")

# Verify users table
try:
    subprocess.check_call([mysql_client, "-u", "root", "--port=3307", "-h", "127.0.0.1", "-e", "SHOW TABLES IN habit_tracker;"], stdout=open(LOG_FILE, 'a'), stderr=subprocess.STDOUT)
except:
    pass

log("Setup DONE. Keeping server active...")

try:
    # Keep the script running while the server is up
    proc.wait()
except KeyboardInterrupt:
    log("Stopping server...")
    proc.terminate()
    proc.wait()
    log("Server stopped.")
