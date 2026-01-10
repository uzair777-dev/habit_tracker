
import subprocess
with open("process_list.txt", "w") as f:
    subprocess.call(["ps", "aux"], stdout=f)
