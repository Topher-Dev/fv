#!/bin/bash

# Define function to monitor config file and trigger script
f_config_setup() {
    local config_file="/etc/fv/config.json"
    local script_path="/home/fvadmin/fv/sbin/env.sh"

    # Function to monitor config file changes
    monitor_config_changes() {
        # Store initial timestamp of the config file
        local current_timestamp=$(stat -c %Y "$config_file")

        echo "Monitoring changes to $config_file..."

        # Infinite loop to continuously monitor changes
        while true; do
            # Get current timestamp of the config file
            local new_timestamp=$(stat -c %Y "$config_file")

            # Compare timestamps to detect changes
            if [ "$new_timestamp" -gt "$current_timestamp" ]; then
                echo "Detected change in $config_file"
                # Update current timestamp to the new timestamp
                current_timestamp=$new_timestamp

                # Execute the script when config file changes
                "$script_path" write2apache &
            fi

            # Sleep for a short duration before checking again
            sleep 5
        done
    }

    # Execute the monitoring function in a background process
    monitor_config_changes &
}

# Call the f_config_setup function
f_config_setup

# Continue with other tasks
echo "Other tasks continue executing while monitoring..."
