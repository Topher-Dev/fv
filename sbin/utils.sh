#!/bin/bash

log_message() {
    local message=$1
    echo "$(date): $message" >> "$APP_LOG_DIR/scrape.log"
}
