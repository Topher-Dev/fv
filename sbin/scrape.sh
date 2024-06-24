#!/bin/bash

# Check for the correct number of arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 source_table"
    exit 1
fi

SCRAPER_NAME=$1

echo "-----------------Starting data scraping for $SCRAPER_NAME-----------------"
# Source the environment variables from app_env
. app_env export

echo "Current PYTHONPATH: $PYTHONPATH"

# Define the path to scrape.py
scrape_script="$APP_GIT_ROOT/data/scrape.py"
log_file="$APP_LOG_DIR/${SCRAPER_NAME}.log"

# Check if the scraper function exists in scrapers.py
if ! grep -q "def $SCRAPER_NAME(" "$APP_GIT_ROOT/data/scrapers.py"; then
    echo "Error: Scraper function '$SCRAPER_NAME' not found in scrapers.py"
    exit 1
fi

# Export the scraper name as an environment variable
export SCRAPER_NAME

# Run Python script and redirect output to log file
python3 "$scrape_script" > "$log_file" 2>&1

tail -f -n200 "$log_file"
