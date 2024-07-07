#!/bin/bash

log_message() {
    local message=$1
    echo "$(date): $message" >> "$APP_LOG_DIR/scrape.log"
}

setup_logrotate() {
    if [ "$EUID" -ne 0 ]; then
        echo "Please run as root (use sudo)"
        exit 1
    fi

    local log_file="$1"
    local rotation_frequency="${2:-daily}"  # Default to daily
    local rotate_count="${3:-14}"           # Default to keeping 14 rotations
    local compress_logs="${4:-true}"        # Default to compressing logs

    if [[ -z "$log_file" ]]; then
        echo "Error: log_file parameter must be provided."
        return 1
    fi

    # Extract directory and log name from the log_file path
    local log_dir
    log_dir=$(dirname "$log_file")
    local log_name
    log_name=$(basename "$log_file")

    # Define the logrotate configuration directory and file
    local logrotate_dir="/etc/logrotate.d"
    local logrotate_conf="$logrotate_dir/$log_name"

    # Determine the compression option
    local compress_option=""
    if [[ "$compress_logs" == "true" ]]; then
        compress_option="compress"
    fi

    # Create the logrotate configuration file
    cat > "$logrotate_conf" <<EOL
$log_file {
    su root root
    $rotation_frequency
    missingok
    rotate $rotate_count
    $compress_option
    delaycompress
    notifempty
    create 0640 root utmp
    sharedscripts
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOL

    # Test the logrotate configuration
    logrotate -d "$logrotate_conf"

    # Force log rotation for immediate testing
    logrotate -f "$logrotate_conf"

    echo "Logrotate configuration for $log_file has been set up and tested."
}


