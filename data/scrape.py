import os
from db import Database
from crud import CRUD
from table import Table
from scrapers import load_scraper

def main():
    scraper_name = os.getenv('SCRAPER_NAME')
    if not scraper_name:
        print("Error: SCRAPER_NAME environment variable is not set.")
        return

    try:
        scraper_function = load_scraper(scraper_name)
    except ValueError as e:
        print(e)
        return

    # Retrieve environment variables for database connection
    host = os.getenv('DATABASE_HOST', 'localhost')
    database = os.getenv('DATABASE_NAME', '')
    user = os.getenv('DATABASE_USER', '')
    password = os.getenv('DATABASE_PASSWORD', '')

    db = Database(host=host, database=database, user=user, password=password)
    crud = CRUD(db)

    try:
        db.connect()
        print("Database connection successful")

        # Scrape data from the internet
        raw_table_data_list = scraper_function()

        for raw_table_data in raw_table_data_list:
            try:
                table = Table(db, raw_table_data)

                # Transform, validate, and save data
                table.transform()
                table.validate()

                if not table.errors:
                    table.save(crud)
                    print("Data saved successfully")
                else:
                    print("Errors occurred during validation:", table.errors)

            except Exception as e:
                print(f"Error processing table data: {e}")

    except Exception as e:
        print(f"Error connecting to database: {e}")
    finally:
        db.disconnect()
        print("Database connection closed")

if __name__ == '__main__':
    main()
