from db import Database

class CRUD:
    def __init__(self, db: Database):
        self.db = db

    def create_one(self, table, data):
        columns = ', '.join(data.keys())
        values = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) RETURNING *"
        try:
            print(f"Creating one record in table {table}: {data}")
            return self.db.create_one(query, list(data.values()))
        except Exception as e:
            print(f"Error creating one record in table {table}: {e}")
            raise

    def create_list(self, table, data_list):
        if not data_list:
            print(f"No data to create in table {table}")
            return []
        columns = ', '.join(data_list[0].keys())
        values = ', '.join(['%s'] * len(data_list[0]))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) RETURNING *"
        params_list = [list(data.values()) for data in data_list]
        try:
            print(f"Creating multiple records in table {table}")
            self.db.create_many(query, params_list)
            return self.read_list(table)
        except Exception as e:
            print(f"Error creating multiple records in table {table}: {e}")
            raise

    def read_one(self, table, criteria):
        columns = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"SELECT * FROM {table} WHERE {columns} LIMIT 1"
        try:
            print(f"Reading one record from table {table} with criteria {criteria}")
            return self.db.read_one(query, list(criteria.values()))
        except Exception as e:
            print(f"Error reading one record from table {table} with criteria {criteria}: {e}")
            raise

    def read_list(self, table, criteria=None):
        if criteria:
            columns = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
            query = f"SELECT * FROM {table} WHERE {columns}"
            try:
                print(f"Reading multiple records from table {table} with criteria {criteria}")
                return self.db.read_all(query, list(criteria.values()))
            except Exception as e:
                print(f"Error reading multiple records from table {table} with criteria {criteria}: {e}")
                raise
        else:
            query = f"SELECT * FROM {table}"
            try:
                print(f"Reading all records from table {table}")
                return self.db.read_all(query)
            except Exception as e:
                print(f"Error reading all records from table {table}: {e}")
                raise

    def update_one(self, table, criteria, data):
        set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE {where_clause} RETURNING *"
        try:
            print(f"Updating one record in table {table} with criteria {criteria}: {data}")
            return self.db.update_one(query, list(data.values()) + list(criteria.values()))
        except Exception as e:
            print(f"Error updating one record in table {table} with criteria {criteria}: {e}")
            raise

    def update_list(self, table, data_list, criteria_list):
        if not data_list or not criteria_list or len(data_list) != len(criteria_list):
            print(f"Mismatch or empty data and criteria for updating records in table {table}")
            return []
        updated_records = []
        try:
            print(f"Updating multiple records in table {table}")
            for data, criteria in zip(data_list, criteria_list):
                updated_record = self.update_one(table, criteria, data)
                updated_records.append(updated_record)
            return updated_records
        except Exception as e:
            print(f"Error updating multiple records in table {table}: {e}")
            raise

    def delete_one(self, table, criteria):
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"DELETE FROM {table} WHERE {where_clause} RETURNING *"
        try:
            print(f"Deleting one record from table {table} with criteria {criteria}")
            return self.db.delete_one(query, list(criteria.values()))
        except Exception as e:
            print(f"Error deleting one record from table {table} with criteria {criteria}: {e}")
            raise

    def delete_list(self, table, criteria_list):
        if not criteria_list:
            print(f"No data to delete in table {table}")
            return []
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria_list[0].keys()])
        query = f"DELETE FROM {table} WHERE {where_clause} RETURNING *"
        params_list = [list(criteria.values()) for criteria in criteria_list]
        deleted_records = []
        try:
            print(f"Deleting multiple records from table {table}")
            for params in params_list:
                deleted_records.append(self.db.delete_one(query, params))
            return deleted_records
        except Exception as e:
            print(f"Error deleting multiple records from table {table}: {e}")
            raise
