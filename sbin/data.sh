

. app_env export
echo "Current PYTHONPATH: $PYTHONPATH"

#export PYTHONPATH="$APP_GIT_ROOT/lib"
#echo "$PYTHONPATH"

scrape_script="$APP_GIT_ROOT/data/scrape.py"

# Run Python script and redirect output to log file
python3 "$scrape_script" >> "$APP_LOG_DIR/data.log" 2>&1
