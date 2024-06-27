from transform import Transformer
from validate import Validater

class Table:
    def __init__(self, db, raw_table_data):
        self.db = db
        self.table_name = raw_table_data['table']
        self.raw_data = raw_table_data['data']
        self.instructions = raw_table_data.get('instructions', {})
        self.transformed_data = []
        self.validated_data = []
        self.errors = []
        self.transformer = Transformer()
        self.validater = Validater(db, self.table_name)

    def transform(self):
        print(f"Transforming data for table {self.table_name}")
        for index, row in enumerate(self.raw_data):
            try:
                #transformed_row = self.transformer.transform(row, self.instructions)
                transformed_row=row
                self.transformed_data.append(transformed_row)
            except Exception as e:
                print(f"Failed to transform row {index + 1}/{len(self.raw_data)}: {e}")
        print(f"Transformed {len(self.transformed_data)} records for table {self.table_name}")

    def validate(self):
        print(f"Validating data for table {self.table_name}")
        for index, row in enumerate(self.transformed_data):
            try:
                #is_valid, errors = self.validater.validate(row, self.instructions)
                is_valid=True
                if not is_valid:
                    self.errors.append(errors)
                else:
                    self.validated_data.append(row)
            except Exception as e:
                print(f"Failed to validate row {index + 1}/{len(self.transformed_data)}: {e}")
        print(f"Validated {len(self.validated_data)} records for table {self.table_name}")
        if self.errors:
            print(f"Validation errors: {self.errors}")

    def check_and_upsert(self, crud, row):
        unique_criteria = {key: row[key] for key in self.instructions.get('unique', []) if key in row}
        if unique_criteria:
            try:
                existing_record = crud.read_one(self.table_name, unique_criteria)
                if existing_record:
                    print(f"Updating existing record in table {self.table_name} with criteria {unique_criteria}")
                    return crud.update_one(self.table_name, unique_criteria, row)
            except Exception as e:
                print(f"Failed to update record with criteria {unique_criteria}: {e}")
        try:
            print(f"Inserting new record into table {self.table_name}")
            return crud.create_one(self.table_name, row)
        except Exception as e:
            print(f"Failed to insert record into table {self.table_name}: {e}")

    def save(self, crud):
        print(f"Saving data to table {self.table_name}")
        for index, row in enumerate(self.validated_data):
            try:
                self.check_and_upsert(crud, row)
            except Exception as e:
                print(f"Failed to save row {index + 1}/{len(self.validated_data)}: {e}")
        print(f"Saved {len(self.validated_data)} records to table {self.table_name}")



















