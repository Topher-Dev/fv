#!/bin/bash

pre() {

   #add JQ check 


    echo "Checking preconditions..."
    # Check for root/superuser privileges
    if [[ $EUID -ne 0 ]]; then
        echo "This script must be run with root privileges."
        return 0
    fi
    echo "Root privileges confirmed."

    # Check if the current directory is part of a Git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Git repository confirmed."
    else
        echo "This script must be executed within a Git repository."
        return 1
    fi

    return 0
}

if pre == 0; then
    cat 
fi



# . env.sh export
