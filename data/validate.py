class Validater:
    def __init__(self, db, table_name):
        self.db = db
        self.table_name = table_name
        self.metadata = self.get_table_metadata()
        print(f"Fetched metadata for table {table_name}: {self.metadata}")

    def get_table_metadata(self):
        query = """
            SELECT
                c.column_name, 
                REPLACE(c.data_type, ' ', '_') as data_type, 
                c.character_maximum_length,
                CASE
                    WHEN tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY') THEN true
                    ELSE false
                END as is_unique,
                c.is_nullable = 'YES' as is_nullable,
                c.column_default IS NOT NULL as has_default
            FROM information_schema.columns as c
            LEFT JOIN (
                SELECT cc.constraint_name, tc.constraint_type, cc.column_name
                FROM information_schema.constraint_column_usage as cc
                JOIN information_schema.table_constraints as tc
                ON cc.constraint_name = tc.constraint_name
                WHERE tc.table_name = %s
            ) as tc ON c.column_name = tc.column_name
            WHERE c.table_name = %s
        """
        try:
            metadata = self.db.read_all(query, [self.table_name, self.table_name])
            return {column['column_name']: column for column in metadata}
        except Exception as e:
            print(f"Error fetching metadata for table {self.table_name}: {e}")
            raise

    def validate(self, row, instructions):
        errors = []
        for column_name, value in row.items():
            # Validate data type
            expected_type = self.metadata[column_name]['data_type']
            if not self.check_type(value, expected_type):
                errors.append(f"Type validation failed for {column_name} with value {value} (expected type: {expected_type})")

            # Additional validation from instructions
            validate_func_name = instructions.get('validate', {}).get(column_name)
            if validate_func_name:
                try:
                    validate_func = globals()[validate_func_name]
                    if not validate_func(value):
                        errors.append(f"Validation failed for {column_name} with value {value}")
                except KeyError:
                    print(f"Warning: Validation function '{validate_func_name}' for field '{column_name}' not found.")
        
        if errors:
            print(f"Validation errors for row: {errors}")
            return False, errors
        return True, row

    def check_type(self, value, expected_type):
        type_checkers = {
            'character_varying': str,
            'integer': int,
            'boolean': bool,
            'timestamp_without_time_zone': str,
            # Add more type mappings as needed
        }
        if expected_type not in type_checkers:
            print(f"Warning: No type checker for expected type '{expected_type}'")
            return True  # Assume valid if we don't have a checker

        return isinstance(value, type_checkers[expected_type])

def validate_name(value):
    return isinstance(value, str) and len(value) > 0

def validate_age(value):
    return isinstance(value, int) and value >= 0

def validate_date(value):
    from datetime import datetime
    try:
        datetime.strptime(value, '%Y-%m-%d')
        return True
    except ValueError:
        return False
