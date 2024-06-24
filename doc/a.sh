#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "$SCRIPT_DIR"

# Function to set up permissions
f_permissions() {
    local APP_GIT_ROOT="/home/fvadmin/fv"
    local APP_GROUP="appaccess"

    # Create group if not exists
    if ! getent group "$APP_GROUP" >/dev/null; then
        groupadd "$APP_GROUP"
        echo "Group $APP_GROUP created."
    fi

    # Add users to the group
    for user in www-data postgres memcache; do
        usermod -a -G "$APP_GROUP" "$user"
    done

    # Confirm group members
    echo "Members of $APP_GROUP group:"
    grep "^$APP_GROUP" /etc/group

    # Ensure group can traverse directories from root
    chmod g+x /home /home/fvadmin

    # Grant access to directories in the app root
    find "$APP_GIT_ROOT" -type d -exec chgrp "$APP_GROUP" {} \;

    # Specify read and execute permissions only
    find "$APP_GIT_ROOT" -type d -exec chmod 750 {} \;
}

# Execute the function with error handling
if f_permissions; then
    echo "Permissions successfully set."
else
    echo "Error setting permissions."
    exit 1
fi
