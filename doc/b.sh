#!/bin/bash

echo "Setting up bin"

create_symlink() {
        local script_path="/home/fvadmin/fv/sbin/env.sh"
        local symlink_path="/usr/local/bin/app_env"

        if [ ! -f "$script_path" ]; then
            echo "Script file not found: $script_path"
            return 1
        fi

        if [ -e "$symlink_path" ]; then
            echo "Symlink $symlink_path already exists."
            return 1
        fi

        ln -s "$script_path" "$symlink_path"
        echo "Created symlink: $symlink_path -> $script_path"
}


create_symlink
