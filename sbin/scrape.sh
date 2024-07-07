#!/bin/bash

# Source environment variables and utility functions
. app_env export
. $APP_GIT_ROOT/sbin/utils.sh

# Utility function to load scraper configuration
load_scraper_config() {
    local config_file=$1
    # Read and parse the config file
    scrapers=($(awk -F "=" '/order/ {print $2}' $config_file | tr ',' ' '))
    declare -A fallbacks
    while IFS='=' read -r key value; do
        fallbacks["$key"]=$value
    done < <(awk -F "=" '/Fallbacks/ {flag=1; next} flag {print}' $config_file)
    echo $scrapers
}

# Function to run scrapers sequentially
run_scrapers() {
    results=()  # Initialize an array to store the results of each scraper
    total_scrapers=${#scrapers[@]}  # Total number of scrapers

    for i in "${!scrapers[@]}"; do
        scraper="${scrapers[$i]}"
        log_message "Running scraper $((i+1))/$total_scrapers: $scraper"
        run_scraper "$scraper"
        if [ $? -ne 0 ]; then
            handle_error "$scraper"
            results+=("$scraper: failed")
        else
            results+=("$scraper: success")
        fi
    done
}

# Function to check if the scraper function exists in any s_*.py file
function_exists() {
    local function_name=$1
    for file in "$APP_GIT_ROOT/data/s_"*.py; do
        if grep -q "def $function_name(" "$file"; then
            return 0
        fi
    done
    return 1
}

# Function to run a single scraper
run_scraper() {
    local SCRAPER_NAME=$1
    local scrape_script="$APP_GIT_ROOT/data/scrape.py"
    local log_file="$APP_LOG_DIR/${SCRAPER_NAME}.log"

    # Check if the scraper function exists in any s_*.py file
    if ! function_exists "$SCRAPER_NAME"; then
        log_message "Error: Scraper function '$SCRAPER_NAME' not found in any s_*.py file"
        return 1
    fi

    # Export the scraper name as an environment variable
    export SCRAPER_NAME

    # Run Python script and redirect output to log file
    python3 "$scrape_script" > "$log_file" 2>&1

    # Check the exit status of the Python script
    if [ $? -ne 0 ]; then
        log_message "Error: Scraper '$SCRAPER_NAME' failed. Check the log file at $log_file for details."
        return 1
    fi

    log_message "Completed data scraping for $SCRAPER_NAME. Log file: $log_file"
}

# Function to handle errors and provide fallbacks
handle_error() {
    local scraper=$1
    if [[ -n "${fallbacks[$scraper]}" ]]; then
        log_message "Attempting fallback for $scraper: ${fallbacks[$scraper]}"
        run_scraper "${fallbacks[$scraper]}"
        if [ $? -ne 0 ]; then
            results+=("${fallbacks[$scraper]}: failed")
            log_message "Fallback failed for $scraper."
        else
            results+=("${fallbacks[$scraper]}: success")
        fi
    else
        log_message "No fallback available for $scraper. Aborting."
        return 1
    fi
}

# Function to check for overall completion and log results
handle_completion() {
    local success_count=0
    local failure_count=0

    log_message "-----------------Scraping Summary-----------------"
    for result in "${results[@]}"; do
        log_message "$result"
        if [[ $result == *"success"* ]]; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done

    log_message "--------------------------------------------------"
    log_message "Total Scrapers Run: ${#results[@]}"
    log_message "Successful Scrapers: $success_count"
    log_message "Failed Scrapers: $failure_count"

    # Print summary to console
    echo "Scraping complete."
    echo "Total Scrapers Run: ${#results[@]}"
    echo "Successful Scrapers: $success_count"
    echo "Failed Scrapers: $failure_count"

    # Output the command to retrieve the log for this specific run
    local start_time=$(date -d "$SCRAPE_START_TIME" +%s)
    local end_time=$(date +%s)
    echo "To view the log for this run, use the following command:"
    echo "awk -v start=$start_time -v end=$end_time '\$1 >= start && \$1 <= end' $APP_LOG_DIR/scrape.log"

    log_message "===================[SCRAPE_END]=================="

    # Exit with a non-zero status if there were any failures
    if [ $failure_count -ne 0 ]; then
        exit 1
    fi

    exit 0
}

#indicate scrape conf

scrape_conf="scrapers.conf"

# Load scraper configuration
load_scraper_config "$APP_GIT_ROOT/etc/$scrape_conf"

log_message "==================[SCRAPE_START]=================="

# Mark the start time of the script
export SCRAPE_START_TIME=$(date +%Y-%m-%d\ %H:%M:%S)

# Run scrapers
run_scrapers

# Check for success and handle errors
handle_completion
