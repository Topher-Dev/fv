#!/bin/bash
#test
# Function to retrieve app_name from /etc/app_name
app_name_file="/etc/app_name"

if [ ! -f "$app_name_file" ]; then
    echo "Error: App name file not found: $app_name_file"
    exit 1
fi

export APP_NAME=$(cat "$app_name_file")

if [ -z "$APP_NAME" ]; then
    echo "Failed to retrieve app_name from file."
    exit 1
fi

export APP_CONFIG_DIR="/etc/${APP_NAME}"
export APP_LOG_DIR="/var/log/${APP_NAME}"
export APP_CONFIG_FILE="${APP_CONFIG_DIR}/config.json"
export APP_GIT_ROOT=$(git rev-parse --show-toplevel)
export PYTHONPATH="$APP_GIT_ROOT/lib"

# Check if the JSON file exists
if [ ! -f "$APP_CONFIG_FILE" ]; then
  echo "JSON file not found: $APP_CONFIG_FILE"
  echo "Please make sure the JSON file exists at the specified path."
  #exit 1
fi

# Extract variables using jq and populate the variable_values array
exported_vars=$(jq -r '
  def flatten:
    . as $in
    | reduce paths(scalars) as $path ({}; .[$path | join("_")] = ($in | getpath($path) | @json));
  flatten
  | to_entries
  | map("export \(.key | gsub("[^a-zA-Z0-9]+"; "_") | ascii_upcase)=\(.value)") | .[]
' < "$APP_CONFIG_FILE") || { echo "Error processing JSON file with jq"; exit 1; }

# This script is used to export the environment variables
f_export() {
    eval "$exported_vars"
    #export the pg variables
    export PGUSER=$DATABASE_USER
    export PGHOST=$DATABASE_HOST
    export PGPASSWORD=$DATABASE_PASSWORD
    export PGDATABASE=$DATABASE_NAME
    export PGPORT=$DATABASE_PORT
    echo "Environment variables exported."
    echo "You should see the APP_NAME here: $APP_NAME"
}

# This script is used to write the environment variables to apache
f_write2apache(){

    # Check for root/superuser privileges
    if [[ $EUID -ne 0 ]]; then
        echo "This script must be run with root privileges."
        return 0
    fi

    declare -A variable_values
	echo "writing to apache"
    # Loop through the variable assignment strings, remove "export" and split on '='
    while read -r assignment; do
        assignment="${assignment#export }"  # Remove "export " prefix
        IFS="=" read -ra parts <<< "$assignment"  # Split on '='
        variable_values["${parts[0]}"]="${parts[1]}"
    done <<< "$exported_vars"

    variable_values["APP_NAME"]="${APP_NAME}"
    variable_values["APP_CONFIG_DIR"]="${APP_CONFIG_DIR}"
    variable_values["APP_LOG_DIR"]="${APP_LOG_DIR}"
    variable_values["APP_CONFIG_FILE"]="${APP_CONFIG_FILE}"
    variable_values["APP_GIT_ROOT"]="${APP_GIT_ROOT}"

    local apache_file="/etc/apache2/sites-available/$APP_NAME.conf"
    local start_marker="### Start of SetEnv Directives ###"
    local end_marker="### End of SetEnv Directives ###"

    # Check if the markers already exist, and if so, remove the existing SetEnv lines
    if grep -q "$start_marker" "$apache_file" && grep -q "$end_marker" "$apache_file"; then
        echo "Replacing existing SetEnv directives in Apache configuration file: $apache_file"
        sed -i "/$start_marker/,/$end_marker/d" "$apache_file"
    else
        echo "Writing key-value pairs to Apache configuration file: $apache_file"
    fi

    echo "$start_marker" >> "$apache_file"
    # Sort the keys of the associative array and write them
    for key in $(printf "%s\n" "${!variable_values[@]}" | sort); do
        echo "SetEnv $key ${variable_values[$key]}" >> "$apache_file"
    done

    echo "$end_marker" >> "$apache_file"
    echo "Done writing to Apache configuration file."
    echo "Restarting server"
    systemctl restart apache2.service


}

# Check the first parameter and call the respective function
case "$1" in
    export)
        f_export
        ;;
    write2apache)
        f_write2apache
        ;;
    *)
        echo "Usage: $0 {export|write2apache}"
        ;;
esac
