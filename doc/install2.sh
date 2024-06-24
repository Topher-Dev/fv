#!/bin/bash

# Array of function names in the order they should be executed
functions=(
    "f_pre"
    "f_config"
    "f_apache"
    # Add more function names here as needed
)

# Function to perform pre-installation tasks
f_pre() {
    echo "Executing pre-installation tasks..."
    # Example: check if required dependencies are installed
    if ! command -v jq >/dev/null 2>&1; then
        echo "Error: jq is not installed. Please install it and try again."
        exit 1
    fi
    # Simulate delay or complex task
    sleep 2
}

# Function to configure application settings
f_config() {
    echo "Configuring application..."
    # Example: configure application settings
    # Simulate delay or complex task
    sleep 3
}

# Function to install and configure Apache
f_apache() {
    echo "Installing and configuring Apache..."
    # Example: install Apache and configure it
    # Simulate delay or complex task
    sleep 4
}

# Initialize counters
total_functions=${#functions[@]}
completed_functions=0

# Loop through the array of functions and execute them with error handling
for func in "${functions[@]}"; do
    ((completed_functions++))
    echo "Running function $completed_functions/$total_functions: $func"
    if ! $func; then
        echo "Error: Function $func failed."
        exit 1
    fi
done

echo "All functions executed successfully."
