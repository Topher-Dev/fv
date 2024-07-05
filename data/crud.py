from db import Database

class CRUD:
    def __init__(self, db: Database):
        self.db = db

    def log_operation(self, operation, table, data):
        print(f"{operation} on {table}: {data['id']}")

    def create_one(self, table, data):
        columns = ', '.join(data.keys())
        values = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) RETURNING id"
        try:
            result = self.db.create_one(query, list(data.values()))
            self.log_operation("CREATE", table, result)
            return result
        except Exception as e:
            print(f"Error creating one record in table {table}: {e}")
            raise

    def create_list(self, table, data_list):
        if not data_list:
            return []
        columns = ', '.join(data_list[0].keys())
        values = ', '.join(['%s'] * len(data_list[0]))
        query = f"INSERT INTO {table} ({columns}) VALUES ({values}) RETURNING id"
        params_list = [list(data.values()) for data in data_list]
        try:
            self.db.create_many(query, params_list)
            results = self.read_list(table)
            for result in results:
                self.log_operation("CREATE", table, result)
            return results
        except Exception as e:
            print(f"Error creating multiple records in table {table}: {e}")
            raise

    def read_one(self, table, criteria):
        columns = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"SELECT * FROM {table} WHERE {columns} LIMIT 1"
        try:
            result = self.db.read_one(query, list(criteria.values()))
            return result
        except Exception as e:
            print(f"Error reading one record from table {table} with criteria {criteria}: {e}")
            raise

    def read_list(self, table, criteria=None):
        if criteria:
            columns = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
            query = f"SELECT * FROM {table} WHERE {columns}"
            try:
                results = self.db.read_all(query, list(criteria.values()))
                return results
            except Exception as e:
                print(f"Error reading multiple records from table {table} with criteria {criteria}: {e}")
                raise
        else:
            query = f"SELECT * FROM {table}"
            try:
                results = self.db.read_all(query)
                return results
            except Exception as e:
                print(f"Error reading all records from table {table}: {e}")
                raise

    def update_one(self, table, criteria, data):
        set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE {where_clause} RETURNING id"
        try:
            result = self.db.update_one(query, list(data.values()) + list(criteria.values()))
            self.log_operation("UPDATE", table, result)
            return result
        except Exception as e:
            print(f"Error updating one record in table {table} with criteria {criteria}: {e}")
            raise

    def delete_one(self, table, criteria):
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria.keys()])
        query = f"DELETE FROM {table} WHERE {where_clause} RETURNING id"
        try:
            result = self.db.delete_one(query, list(criteria.values()))
            self.log_operation("DELETE", table, result)
            return result
        except Exception as e:
            print(f"Error deleting one record from table {table} with criteria {criteria}: {e}")
            raise

    def delete_list(self, table, criteria_list):
        if not criteria_list:
            return []
        where_clause = ' AND '.join([f"{key} = %s" for key in criteria_list[0].keys()])
        query = f"DELETE FROM {table} WHERE {where_clause} RETURNING id"
        params_list = [list(criteria.values()) for criteria in criteria_list]
        try:
            deleted_records = []
            for params in params_list:
                deleted_record = self.db.delete_one(query, params)
                self.log_operation("DELETE", table, deleted_record)
                deleted_records.append(deleted_record)
            return deleted_records
        except Exception as e:
            print(f"Error deleting multiple records from table {table}: {e}")
            raise
