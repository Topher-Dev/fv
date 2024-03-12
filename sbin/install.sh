#!/bin/bash

# Initialize variables as empty, set in f_config
APP_NAME=""
CONFIG_DIR=""
LOG_DIR=""
GIT_ROOT=""
CONFIG_FILE=""

f_pre() {
    echo "Checking preconditions..."

    # Check for root/superuser privileges
    if [[ $EUID -ne 0 ]]; then
        echo "This script must be run with root privileges."
        exit 1
    fi
    echo "Root privileges confirmed."

    # Check if the current directory is part of a Git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Git repository confirmed."
    else
        echo "This script must be executed within a Git repository."
        exit 1
    fi
}

f_jq() {
    echo "Attempting to install jq..."

    # Check if jq is already installed
    if ! command -v jq &> /dev/null; then
        echo "jq could not be found, attempting installation."

        # Update package lists to ensure we can install the latest version
        apt update

        # Install jq
        apt install -y jq

        # Check if jq was successfully installed
        if command -v jq &> /dev/null; then
            echo "jq successfully installed."
        else
            echo "Failed to install jq. Please install it manually."
            exit 1
        fi
    else
        echo "jq is already installed."
    fi
}

f_config() {
    APP_NAME=$(basename -s .git `git config --get remote.origin.url`)
    CONFIG_DIR="/etc/${APP_NAME}"
    LOG_DIR="/var/log/${APP_NAME}"
    GIT_ROOT=$(git rev-parse --show-toplevel)
    CONFIG_FILE="${CONFIG_DIR}/config.json"

    # Check if the config file already exists
    if [ -f "$CONFIG_FILE" ]; then
        echo "Configuration already exists at $CONFIG_FILE."
        echo "No changes were made to avoid overwriting existing configuration."
        return 0
    fi

    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"
    echo "Configuration and log directories created."

    # Prompt user for configurations
    read -p "Enter run mode (dev/prod): " runmode
    while [[ "$runmode" != "dev" && "$runmode" != "prod" ]]; do
        echo "Run mode must be 'dev' or 'prod'."
        read -p "Enter run mode (dev/prod): " runmode
    done

    read -p "Enter JWT secret key (min 8 characters): " jwt_secret
    while [[ ! $jwt_secret =~ ^.{8,}$ ]]; do
        echo "JWT secret key must be at least 8 characters."
        read -p "Enter JWT secret key (min 8 characters): " jwt_secret
    done

    read -p "Enter database password (min 8 characters, must contain numbers and letters): " db_password
    while [[ ! $db_password =~ ^.{8,}$ ]]; do
        echo "Database password must be at least 8 characters and contain both numbers and letters."
        read -p "Enter database password: " db_password
    done

    # Build the file
    CONFIG_TEMPLATE="$(jq -r \
    --arg appname "$APP_NAME" \
    --arg runmode "$runmode" \
    --arg jwtsecret "$jwt_secret" \
    --arg dbpassword "$db_password" \
    '
    .app.name = $appname |
    .app.runmode = $runmode |
    .jwt.secret = $jwtsecret |
    .database.name = $appname |
    .database.user = $appname |
    .database.password = $dbpassword
    ' "$GIT_ROOT/etc/config.template.json")"

    echo "$CONFIG_TEMPLATE" | tee "$CONFIG_DIR/config.json" > /dev/null

    # Remove "COMMENT" entries from the template
    jq 'del(.. | .COMMENT?)' "$CONFIG_DIR/config.json"

    echo "Configuration file successfully created at $CONFIG_DIR/config.json"
}

f_apt() {
    echo "Updating apt"
    sudo apt update

    # Use jq to parse the config file for dependencies.apt and install them
    echo "Checking reliability of apt package names: "
    DEPENDENCIES=$(jq -r '.dependencies.apt | join(" ")' "$CONFIG_DIR/config.json")

    # Simulate the installation of the packages to check if all are available
    OUTPUT=$(sudo apt install -s $DEPENDENCIES 2>&1)

    # Extract lines from the OUTPUT that contain "Unable to locate package"
    NOT_FOUND=$(echo "$OUTPUT" | grep -oP "Unable to locate package \K.*")

    if [[ -n "$NOT_FOUND" ]]; then
        # At least one package was not found
        echo "The following packages were unable to be located:"
        echo "$NOT_FOUND"
        echo "Fix the problem with the names and try again."
        exit 1
    else
        # All packages were found
        echo "All packages were found, now installing."
        TEMP_FILE="/tmp/apt_install_output.tmp"
        sudo apt install -y $DEPENDENCIES | tee "$TEMP_FILE"
    fi

    # Check the temporary file for the message about unused packages and run autoremove if needed
    if grep -q "Use 'sudo apt autoremove' to remove them" "$TEMP_FILE"; then
        echo "Running autoremove"
        sudo apt autoremove
    fi

    # Check that all $DEPENDENCIES were installed; throw an error if not
    for package in $DEPENDENCIES; do
        if ! dpkg -l | grep -qw $package; then
            echo "The package $package was not installed, please check the config file and try again."
            exit 1
        fi
    done

    echo "Package installation completed successfully."
    rm "$TEMP_FILE"
}

f_pip() {
    echo "Ensuring virtualenv is installed..."

    # Install virtualenv if not already installed
    if ! command -v virtualenv &> /dev/null; then
        apt update
        apt install -y python3-virtualenv
        echo "virtualenv successfully installed."
    fi

    # Define the virtual environment directory
    VENV_DIR="$CONFIG_DIR/venv"

    # Create a virtual environment if it doesn't exist
    if [ ! -d "$VENV_DIR" ]; then
        python3 -m virtualenv "$VENV_DIR"
        echo "Virtual environment created at $VENV_DIR."
    else
        echo "Virtual environment already exists at $VENV_DIR. Ensuring it's up to date..."
    fi

    # Activate the virtual environment
    source "$VENV_DIR/bin/activate"

    # Upgrade pip in the virtual environment to the latest version
    pip install --upgrade pip

    # Parse Python package dependencies from the config file
    echo "Checking for Python package dependencies..."
    PYTHON_DEPENDENCIES=$(jq -r '.dependencies.pip[]' "$CONFIG_DIR/config.json")

    echo "Processing Python package installations..."
    for pkg in $PYTHON_DEPENDENCIES; do
        echo "Checking installation status of $pkg..."

        # Check if package is already installed in the virtual environment
        if pip freeze | grep -i ^$pkg== &> /dev/null; then
            echo "$pkg is already installed."
        else
            echo "Installing $pkg..."
            if pip install "$pkg"; then
                echo "$pkg successfully installed."
            else
                echo "Failed to install $pkg. Please check for errors."
                # Optionally, you can decide to stop the process upon the first failure
                deactivate
                exit 1
            fi
        fi
    done

    echo "All specified Python packages have been processed."

    # Deactivate the virtual environment
    deactivate
}

f_database() {
    # Load database configuration from config.json
    CONFIG_FILE="$CONFIG_DIR/config.json"
    declare -A DB

    while IFS== read -r key value; do
        DB[$key]=$value
    done < <(jq -r '.database | to_entries | .[] | .key + "=" + .value ' "$CONFIG_FILE")

    echo "Setting up database: ${DB[name]}"

    # Check if the user exists
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB[user]}'" | grep -qw 1; then
        echo "Creating PostgreSQL user ${DB[user]}"
        sudo -u postgres psql -c "CREATE USER ${DB[user]} WITH PASSWORD '${DB[password]}';"
    else
        echo "User ${DB[user]} already exists."
    fi

    # Check if the database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB[name]}; then
        echo "Creating PostgreSQL database ${DB[name]}"
        sudo -u postgres psql -c "CREATE DATABASE \"${DB[name]}\" OWNER \"${DB[user]}\";"
    else
        echo "Database ${DB[name]} already exists."
    fi

    echo "Granting all privileges on database ${DB[name]} to ${DB[user]}"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB[name]}\" TO ${DB[user]};"

    echo "Finished database configuration"

    echo "Loading SQL init file into the database"
    for sql_file in ini.sql functions.sql views.sql; do
        echo "Processing $sql_file..."
        sudo -u postgres psql -d "${DB[name]}" -a -f "$GIT_ROOT/etc/$sql_file"
    done

    echo "SQL files loaded into the database successfully."
}

# Check the first parameter and call the respective function
case "$1" in
    full)
        f_pre
        #f_jq
        f_config
	#f_apt
	#f_pip
	f_database
        ;;
    *)
        echo "Usage: $0 {full}"
        exit 1
        ;;
esac
