#!/bin/bash

# Function to run a scraper script
run_scraper() {
    local SCRAPER_NAME=$1
    local scrape_script="$APP_GIT_ROOT/data/scrape.py"
    local log_file="$APP_LOG_DIR/${SCRAPER_NAME}.log"

    echo "-----------------Starting data scraping for $SCRAPER_NAME-----------------"

    # Check if the scraper function exists in scrapers.py
    if ! grep -q "def $SCRAPER_NAME(" "$APP_GIT_ROOT/data/scrapers.py"; then
        echo "Error: Scraper function '$SCRAPER_NAME' not found in scrapers.py"
        return 1
    fi

    # Export the scraper name as an environment variable
    export SCRAPER_NAME

    # Run Python script and redirect output to log file
    python3 "$scrape_script" > "$log_file" 2>&1

    if [ $? -ne 0 ]; then
        echo "Error: Scraper '$SCRAPER_NAME' failed. Check the log file at $log_file for details."
        return 1
    fi

    echo "Completed data scraping for $SCRAPER_NAME. Log file: $log_file"
}

# Source the environment variables from app_env
. app_env export

echo "Current PYTHONPATH: $PYTHONPATH"

# Check for the correct number of arguments
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <source_table> or $0 full"
    exit 1
fi

# Determine if we are running a single scraper or in 'full' mode
if [ "$1" == "full" ]; then
    # Define the list of designated scripts to run in 'full' mode
    designated_scrapers=("ufcevent_3" "ufcfight_1" "ufcevent_2" "ufcfight_2")

    # Run each scraper sequentially
    for SCRAPER_NAME in "${designated_scrapers[@]}"; do
        run_scraper "$SCRAPER_NAME"
        if [ $? -ne 0 ]; then
            echo "Error occurred in '$SCRAPER_NAME'. Aborting the full mode execution."
            exit 1
        fi
    done
else
    # Run the single scraper script passed as an argument
    run_scraper "$1"
fi
