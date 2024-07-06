#!/bin/bash

app_env export

# Get a list of all tables in the database
tables=$(psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")

# remove the first and second lines of the output
tables=$(echo "$tables" | tail -n +3)

# remove the last line of the output
tables=$(echo "$tables" | head -n -1)

# Display a numbered list of tables for the user to choose from
echo "Select the table you would like to model:"
i=1
while read -r line; do
  echo "$i) $line"
  ((i++))
done <<< "$tables"

# Get the user's selection
read -p "Enter the number of the table you would like to model: " table_num

# Get the table name from the user's selection
table_name=$(echo "$tables" | sed -n "${table_num}p")
table_name=$(echo "$table_name" | tr -d ' ')

output_file=$APP_GIT_ROOT/web/server/models/$table_name.json

# Set the query to select the column names, data types, constraints, nullability, and default values from the table
query="SELECT c.column_name, c.data_type,
CASE
    WHEN tc.constraint_type = 'UNIQUE' THEN 'true'
    WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'true'
    ELSE 'false'
END as constraint,
CASE
    WHEN c.is_nullable = 'NO' THEN 'false'
    WHEN c.is_nullable = 'YES' THEN 'true'
END as nullable,
CASE
    WHEN c.column_default IS NOT NULL THEN 'true'
    ELSE 'false'
END as default_value
FROM information_schema.columns as c
LEFT JOIN (
    SELECT cc.constraint_name, tc.constraint_type, cc.column_name
    FROM information_schema.constraint_column_usage as cc
    JOIN information_schema.table_constraints as tc
    ON cc.constraint_name = tc.constraint_name
    WHERE tc.table_name = '$table_name'
    ) as tc
ON c.column_name = tc.column_name
WHERE c.table_name = '$table_name';"

# Execute the query and store the results in a variable
results=$(psql -c "$query")

# remove the first and second lines of the output
results=$(echo "$results" | tail -n +3)

# remove the last line of the output
results=$(echo "$results" | head -n -1)

# Initialize an empty fields array
fields=()

# Iterate through the results and add each field to the fields array

while read -r line; do
  # Split the line into an array using '|' as the delimiter
  IFS='|' read -ra field <<< "$line"

  # Extract the column name, data type, constraint, nullability, and default value from the field array
  column_name=$(echo "${field[0]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/[[:space:]]/_/g')

  # Add the field to the fields array with default values
  fields+=(
    "\"$column_name\": {
      \"include_in_form\": true,
      \"validation\": {},
      \"html\": {
        \"template\": \"input-std\",
        \"element\": {
          \"attributes\": {},
          \"data\": {},
          \"single\": []
        },
        \"label\": {
          \"attributes\": {},
          \"text\": \"$column_name\"
        },
        \"options\": {},
        \"icon\": {}
      }
    }")
done <<< "$results"

# Join the fields array into a string
fields_string=$(IFS=, ; echo "${fields[*]}")
#echo $fields_string
operations="{ \
  \"create_one\": { \
    \"method\": \"POST\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"\" \
      } \
    }, \
    \"response\": { \
      \"type\": \"json\", \
      \"required\": [\"id\"] \
    } \
  }, \
  \"create_list\": { \
    \"method\": \"POST\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"list\" \
      } \
    }, \
    \"response\": { \
      \"type\": \"boolean\" \
    } \
  }, \
  \"read_one\": { \
    \"method\": \"GET\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"id\" \
      } \
    }, \
    \"response\": { \
      \"type\": \"json\", \
      \"required\": [\"id\"] \
    } \
  }, \
  \"read_list\": { \
    \"method\": \"GET\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"\", \
        \"filter\": {} \
      } \
    }, \
    \"response\": { \
      \"type\": \"json\", \
      \"required\": [\"id\"] \
    } \
  }, \
  \"update_one\": { \
    \"method\": \"PUT\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"id\", \
        \"filter\": {} \
      } \
    }, \
    \"response\": { \
      \"type\": \"boolean\" \
    } \
  }, \
  \"update_list\": { \
    \"method\": \"PUT\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"list\", \
        \"filter\": {} \
      } \
    }, \
    \"response\": { \
      \"type\": \"boolean\" \
    } \
  }, \
  \"delete_one\": { \
    \"method\": \"DELETE\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"id\" \
      } \
    }, \
    \"response\": { \
      \"type\": \"boolean\" \
    } \
  }, \
  \"delete_list\": { \
    \"method\": \"DELETE\", \
    \"request\": { \
      \"requires\": { \
        \"role\": \"\", \
        \"param\": \"list\", \
        \"filter\": {} \
      } \
    }, \
    \"response\": { \
      \"type\": \"boolean\" \
    } \
  } \
}"

# Create the JSON object
json="{
  \"table\": \"$table_name\",
  \"fields\": { $fields_string },
  \"operations\": $operations
}"

if test -e "$output_file"; then
  echo "file already exists, saving to /tmp"
  output_file="/tmp/$table_name.json"
else
  echo "Saving new model to $output_file"
fi

echo $json > "$output_file"
tmp="/tmp/$table_name.tmp"

# verify json through JQ and it will handle the \n line and indenting
cp   "$output_file"  "$tmp" &&
jq . "$tmp" > "$output_file" &&
rm   "$tmp"

#create the controller file
#!/bin/bash

# Define the output file path
output_file="$APP_GIT_ROOT/web/server/controllers/${table_name}.php"

# Check if the file exists
if [ -f "$output_file" ]; then
    echo "File already exists: $output_file"
else
    # Create the controller file
    echo "<?php" > "$output_file"
    echo "include_once \$_SERVER[\"APP_GIT_ROOT\"].\"/web/server/controller.php\";" >> "$output_file"
    echo "" >> "$output_file"
    echo "class $(tr '[:lower:]' '[:upper:]' <<< ${table_name:0:1})${table_name:1} extends Controller {" >> "$output_file"
    echo "" >> "$output_file"
    echo "    public \$model_name = \"$table_name\";" >> "$output_file"
    echo "    public \$table_name = \"$table_name\";" >> "$output_file"
    echo "" >> "$output_file"
    echo "}" >> "$output_file"

    echo "Controller file created: $output_file"
fi





