#!/bin/bash

# Source the environment variables from app_env
echo "Sourcing environment variables from app_env"
. app_env

# Construct the full path to sbin/env.sh using APP_GIT_ROOT
ENV_SH_PATH="$APP_GIT_ROOT/sbin/env.sh"
echo "Constructed path to env.sh: $ENV_SH_PATH"

# Source the env.sh script with the 'export' argument to get access to write2apache function
echo "Sourcing env.sh with 'export' argument"
. "$ENV_SH_PATH" export

# Use the environment variable for the config file
CONFIG_FILE="$APP_CONFIG_FILE"
echo "Using config file: $CONFIG_FILE"

# Function to update the version
update_version() {
  local operation=$1
  echo "Current operation: $operation"
  
  local current_version=$(grep -oP '"version": "\K[0-9]+\.[0-9]+' "$CONFIG_FILE")
  echo "Current version: $current_version"
  
  local major_version=$(echo "$current_version" | cut -d'.' -f1)
  local minor_version=$(echo "$current_version" | cut -d'.' -f2)

  if [ "$operation" == "upgrade" ]; then
    minor_version=$((minor_version + 1))
    echo "Upgrading version"
  elif [ "$operation" == "downgrade" ]; then
    if [ "$minor_version" -gt 0 ]; then
      minor_version=$((minor_version - 1))
      echo "Downgrading version"
    else
      echo "Cannot downgrade version below 0.0"
      exit 1
    fi
  else
    echo "Invalid operation: $operation"
    echo "Usage: $0 {upgrade|downgrade}"
    exit 1
  fi

  new_version="${major_version}.${minor_version}"
  echo "New version: $new_version"

  # Use sed to update the version in the config file
  echo "Updating version in config file"
  sed -i "s/\"version\": \"${current_version}\"/\"version\": \"${new_version}\"/" "$CONFIG_FILE"

  echo "Version updated to ${new_version} in $CONFIG_FILE"
}

# Function to call write2apache
call_write2apache() {
  echo "Calling write2apache"
  "$ENV_SH_PATH" write2apache
  echo "write2apache executed"
}

# Function to check and run SQL file if it exists
check_and_run_sql() {
  local sql_file="/etc/fv/${new_version}.sql"
  if [ -f "$sql_file" ]; then
    echo "SQL file found: $sql_file"
    echo "Running SQL file: $sql_file"
    psql -f "$sql_file"
    echo "SQL file executed"
  else
    echo "No SQL file found for version $new_version"
  fi
}

# Main script logic
if [ $# -ne 1 ]; then
  echo "Usage: $0 {upgrade|downgrade}"
  exit 1
fi

operation=$1

echo "Starting version update process"
update_version "$operation"

echo "Checking for SQL file to execute"
check_and_run_sql

echo "Calling write2apache function"
call_write2apache

echo "Script execution completed"

