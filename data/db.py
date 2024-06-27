import psycopg
from psycopg.rows import dict_row

class Database:
    def __init__(self, engine='psql', host='localhost', database='', user='', password=''):
        self.engine = engine
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.connection = None

    def connect(self):
        try:
            if self.engine == 'psql':
                print(f"Connecting to PostgreSQL database at {self.host}")
                self.connection = psycopg.connect(
                    host=self.host,
                    dbname=self.database,
                    user=self.user,
                    password=self.password,
                    row_factory=dict_row
                )
                self.connection.autocommit = True
                print("Connected to PostgreSQL database")
            else:
                raise ValueError(f"Unsupported engine type: {self.engine}")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            raise

    def disconnect(self):
        if self.connection:
            try:
                self.connection.close()
                print("Disconnected from database")
            except Exception as e:
                print(f"Error disconnecting from database: {e}")
                raise

    def begin(self):
        if self.connection:
            try:
                print("Beginning transaction")
                self.connection.autocommit = False
            except Exception as e:
                print(f"Error beginning transaction: {e}")
                raise

    def commit(self):
        if self.connection:
            try:
                print("Committing transaction")
                self.connection.commit()
                self.connection.autocommit = True
            except Exception as e:
                print(f"Error committing transaction: {e}")
                self.rollback()
                raise

    def rollback(self):
        if self.connection:
            try:
                print("Rolling back transaction")
                self.connection.rollback()
                self.connection.autocommit = True
            except Exception as e:
                print(f"Error rolling back transaction: {e}")
                raise

    def execute_query(self, query, params=None):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
        except Exception as e:
            print(f"Error executing query: {query} with params: {params} - {e}")
            self.rollback()
            raise

    def execute_many(self, query, params_list):
        try:
            with self.connection.cursor() as cursor:
                cursor.executemany(query, params_list)
        except Exception as e:
            print(f"Error executing many: {query} with params_list: {params_list} - {e}")
            self.rollback()
            raise

    def create_one(self, query, params):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        except Exception as e:
            print(f"Error creating one: {query} with params: {params} - {e}")
            self.rollback()
            raise

    def create_many(self, query, params_list):
        try:
            with self.connection.cursor() as cursor:
                cursor.executemany(query, params_list)
        except Exception as e:
            print(f"Error creating many: {query} with params_list: {params_list} - {e}")
            self.rollback()
            raise

    def read_one(self, query, params=None):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        except Exception as e:
            print(f"Error reading one: {query} with params: {params} - {e}")
            raise

    def read_all(self, query, params=None):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Error reading all: {query} with params: {params} - {e}")
            raise

    def update_one(self, query, params):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        except Exception as e:
            print(f"Error updating one: {query} with params: {params} - {e}")
            self.rollback()
            raise

    def delete_one(self, query, params):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        except Exception as e:
            print(f"Error deleting one: {query} with params: {params} - {e}")
            self.rollback()
            raise

    def delete_many(self, query, params_list):
        try:
            with self.connection.cursor() as cursor:
                cursor.executemany(query, params_list)
        except Exception as e:
            print(f"Error deleting many: {query} with params_list: {params_list} - {e}")
            self.rollback()
            raise
