# #!/bin/bash

# export APP_ROOT=/home/topher/salesprep

# # Source the environment variables
# . $APP_ROOT/sbin/env.sh

# # Run the PHP script in the background
# sudo -E -u www-data nohup php $APP_ROOT/web/server/wss.php > wss_output.log 2>&1 &

#!/bin/bash

<<<<<<< Updated upstream
# Define the application root
export APP_ROOT=/home/topher/salesprep
=======
export APP_ROOT=/home/arc/salesprep
>>>>>>> Stashed changes

# Define the PID file location
PID_FILE="/tmp/salesprep_wss.pid"

# Function to start the server
start_server() {
    # Source the environment variables
    . $APP_ROOT/sbin/env.sh

    # Start the PHP script in the background and save its PID
    sudo -E -u www-data nohup php $APP_ROOT/web/server/wss.php > wss_output.log 2>&1 &
    echo $! > "$PID_FILE"
    echo "Server started with PID $(cat $PID_FILE)"
}

# Function to stop the server
stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
           sudo kill $PID
           echo "Server stopped"
        else
           echo "Server not running"
        fi
        rm -f "$PID_FILE"
    else
        echo "PID file not found. Is the server running?"
        ps -ef | grep wss.php
    fi
}

# Function to restart the server
restart_server() {
    stop_server
    start_server
}

# Check the first parameter and call the respective function
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac

