#!/bin/bash


# Source the environment variables from app_env
. app_env export

# get the backup dir in one directory above the app root
BACKUP_DIR="$APP_ROOT/../backups"

#create the backup dir if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi

#load config environment variables
. $APP_ROOT/sbin/env.sh

PGUSER=$DATABASE_USER
PGDATABASE=$DATABASE_NAME
PGPORT=$DATABASE_PORT
PGHOST=$DATABASE_HOST
PGPASSWORD=$DATABASE_PASSWORD

# Set the command
cmd=$1

# Use a case statement to handle different commands
case "$cmd" in
  "backup")
    date
    echo "Backup dir: $BACKUP_DIR"
    BACKUP_FILE=$(echo $NAME"_"$(date +\%Y\%m\%d_\%HH00)"_VERSION_"$VERSION.sql | awk '{print toupper(substr($0, 1, length($0)-4))tolower(substr($0, length($0)-3))}')
    echo "Creating backup: $BACKUP_FILE"
    # # Define the maximum number of backups to keep
    LIMIT=50

    # Create a backup using pg_dump
    /usr/bin/pg_dump -U $PGUSER -d $PGDATABASE -Fc --clean -f $BACKUP_DIR/$BACKUP_FILE

    # Compress the backup
    gzip -f $BACKUP_DIR/$BACKUP_FILE

    # Remove old backups if the limit is exceeded
    while [ $(ls -t $BACKUP_DIR | wc -l) -gt $LIMIT ]; do
        # List all backups in the directory, sort by modification time (newest first), and remove the oldest one
        ls -t $BACKUP_DIR | tail -1 | xargs -I {} rm $BACKUP_DIR/{}
    done

    # Calculate and display the total size of backups
    total_size=$(du -sh $BACKUP_DIR | awk '{print $1}')
    echo "Total size of backups in $BACKUP_DIR: $total_size"
    ;;
  "load")
    # Get the path to the backup file
    BACKUP_FILE=$2

    # Check if the backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "Backup file not found: $BACKUP_FILE"
      echo "Please make sure the backup file exists at the specified path."
      exit 1
    fi

    # Check if the backup file is a gzip compressed custom format file
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        # Decompress the file while keeping the original
        gunzip -k $BACKUP_FILE

        # Get the name of the decompressed file
        DECOMPRESSED_FILE=${BACKUP_FILE%.gz}

        # Restore the backup using pg_restore with the cascade option
        /usr/bin/pg_restore -U $PGUSER -d $PGDATABASE -c -1 --if-exists --clean $DECOMPRESSED_FILE
    else
        # Restore the backup using pg_restore for custom format dumps with the cascade option
        /usr/bin/pg_restore -U $PGUSER -d $PGDATABASE -c -1 --if-exists --clean $BACKUP_FILE
    fi

    # Remove the decompressed file if it exists
    if [ -f "$DECOMPRESSED_FILE" ]; then
      rm $DECOMPRESSED_FILE
    fi

    # psql -U $PGUSER -d $PGDATABASE -c "update person set password='Chris123!'" #set all passwords to Chris123!
    psql -U $PGUSER -d $PGDATABASE -c "update person set email=concat(id, '@salesprep.ca')" #set all emails to {id}@salesprep
    psql -U $PGUSER -d $PGDATABASE -c "update person set phone=concat('180000000', id)" #set all phone numbers to 180000000{id}
    
    ;;
  "list")
    psql -U $PGUSER -d $PGDATABASE -c "\dt"
    ;;
  "sync")
    # Sync the backups from the remote server
    LOCAL_KEY="$APP_ROOT/keys/salesprep"
    LOCAL_BACKUP_DIR="$APP_ROOT/../backups"
    REMOTE_BACKUP_DIR="/home/arc/backups"
    REMOTE_HOST="salesprep.app"
    REMOTE_USER="arc"
    REMOTE_PORT="22"
    NUMBER_OF_BACKUPS=${2:-50}  # Use the second argument or default to 50 if not provided

    # Check if the local key exists
    if [ ! -f "$LOCAL_KEY" ]; then
      echo "Local key not found: $LOCAL_KEY"
      echo "Please make sure the key file exists at the specified path."
      exit 1
    fi

    # Get a list of the recent backups on the remote server and check if they exist locally
    ssh -i $LOCAL_KEY -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "ls -t $REMOTE_BACKUP_DIR" | head -n $NUMBER_OF_BACKUPS | while read -r file; do
      if [ ! -f "$LOCAL_BACKUP_DIR/$file" ]; then
        echo "Syncing $file"
        scp -i $LOCAL_KEY -P $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST:$REMOTE_BACKUP_DIR/$file $LOCAL_BACKUP_DIR/$file
      fi
    done
    ;;
  "reverse_sync")
    #Sync the backups from the local machine to the remote server
    LOCAL_KEY="$APP_ROOT/keys/salesprep"
    LOCAL_BACKUP_DIR="$APP_ROOT/../backups"
    REMOTE_BACKUP_DIR="/home/arc/backups"
    REMOTE_HOST="salesprep.app"
    REMOTE_USER="arc"
    REMOTE_PORT="22"

    #check if the local key exists
    if [ ! -f "$LOCAL_KEY" ]; then
      echo "Local key not found: $LOCAL_KEY"
      echo "Please make sure the key file exists at the specified path."
      exit 1
    fi

    #get a list of the backups on the local machine and check if they exist on the remote server
    ls -t $LOCAL_BACKUP_DIR | while read -r file; do
      if [ ! -f "$REMOTE_BACKUP_DIR/$file" ]; then
        echo "Syncing $file"
        scp -i $LOCAL_KEY -P $REMOTE_PORT $LOCAL_BACKUP_DIR/$file $REMOTE_USER@$REMOTE_HOST:$REMOTE_BACKUP_DIR/$file
      fi
    done
    ;;
  #write a utility "pword" to change the password of a user by email
  "pword")
    # Get the email and password from the command line
    EMAIL=$2
    PASSWORD=$3

    # Check if the email and password were provided
    if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
      echo "Please provide an email and password as arguments."
      exit 1
    fi

    # Check if the user exists
    USER_ID=$(psql -U $PGUSER -d $PGDATABASE -t -c "select id from person where email='$EMAIL'")
    if [ -z "$USER_ID" ]; then
      echo "User not found: $EMAIL"
      exit 1
    fi

    #hash the password iwth php password_hash
    HASHED_PASSWORD=$(php -r "echo password_hash('$PASSWORD', PASSWORD_DEFAULT);")

    # Update the user's password
    psql -U $PGUSER -d $PGDATABASE -c "update person set password='$HASHED_PASSWORD' where id=$USER_ID"

    echo "Password updated for user: $EMAIL"

    ;;
  "reset")
    query=$(cat <<-EOSQL
        DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;
EOSQL
    )
    psql -U $PGUSER -d $PGDATABASE -c "$query"

    # Run the ini.sql & view.sql files to recreate the database
    psql -U $PGUSER -d $PGDATABASE -f "$APP_GIT_ROOT/etc/ini.sql"
    psql -U $PGUSER -d $PGDATABASE -f "$APP_GIT_ROOT/etc/views.sql"
    psql -U $PGUSER -d $PGDATABASE -f "$APP_GIT_ROOT/etc/functions.sql"

    #php $APP_GIT_ROOT/web/client/arc.php --s=auth --m=register --token=null --email=su@salesprep.ca --password=Chris123! --first_name=super --last_name=user --phone=180000000 --company_id=1 --role_id=1
    #php $APP_GIT_ROOT/web/client/arc.php --s=auth --m=register --token=null --email=admin@salesprep.ca --password=Chris123! --first_name=admin --last_name=user --phone=180000000 --company_id=1 --role_id=2
    #php $APP_GIT_ROOT/web/client/arc.php --s=auth --m=register --token=null --email=clerk@salesprep.ca --password=Chris123! --first_name=clerk --last_name=user --phone=180000000 --company_id=1 --role_id=3

    ;;
  *)
    #let the user know if they used an invalid command
    echo "Invalid command: $cmd"
    echo "Available commands are: sync, backup, load [path], list, reset"
    ;;


esac
