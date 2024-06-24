from db import Database
from crud import CRUD

def create_test_table(db):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );
    """
    db.execute_query(create_table_query)
    print("Test table created")

def drop_test_table(db):
    drop_table_query = "DROP TABLE IF EXISTS test_table;"
    db.execute_query(drop_table_query)
    print("Test table dropped")

def test_single_record_operations(crud):
    try:
        # Test creating a single record
        data = {'name': 'Jane Doe'}
        result = crud.create_one('test_table', data)
        print("Record created:", result)

        # Test reading a single record
        criteria = {'id': result['id']}
        read_record = crud.read_one('test_table', criteria)
        print("Record read:", read_record)

        # Test updating a single record
        update_data = {'name': 'Jane Smith'}
        updated_record = crud.update_one('test_table', criteria, update_data)
        print("Record updated:", updated_record)

        # Test deleting a single record
        deleted_record = crud.delete_one('test_table', criteria)
        print("Record deleted:", deleted_record)
    except Exception as e:
        print(f"Error in single record operations: {e}")

def test_list_operations(crud):
    try:
        # Test creating multiple records
        data_list = [{'name': 'Alice'}, {'name': 'Bob'}, {'name': 'Charlie'}]
        created_records = crud.create_list('test_table', data_list)
        print("Records created:", created_records)

        # Test reading multiple records
        read_records = crud.read_list('test_table')
        print("Records read:", read_records)

        # Test updating multiple records
        criteria_list = [{'id': record['id']} for record in created_records]
        update_data_list = [{'name': f"Updated {record['name']}"} for record in created_records]
        updated_records = []
        for criteria, update_data in zip(criteria_list, update_data_list):
            updated_record = crud.update_one('test_table', criteria, update_data)
            updated_records.append(updated_record)
        print("Records updated:", updated_records)

        # Test deleting multiple records
        deleted_records = crud.delete_list('test_table', criteria_list)
        print("Records deleted:", deleted_records)
    except Exception as e:
        print(f"Error in list operations: {e}")
