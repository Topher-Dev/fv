import os
import sys
from db import Database
from crud import CRUD
from table import Table

# scrapers
from s_ufc_event_1 import ufcevent_1
from s_ufc_event_2 import ufcevent_2
from s_ufc_event_3 import ufcevent_3
from s_ufc_fight_1 import ufcfight_1
from s_wiki_event_1 import wikievent_1

def load_scraper(scraper_name):
    try:
        scraper_function = globals()[scraper_name]
        return scraper_function
    except KeyError:
        raise ValueError(f"Scraper function '{scraper_name}' not found.")

def main():
    scraper_name = os.getenv('SCRAPER_NAME')
    if not scraper_name:
        print("Error: SCRAPER_NAME environment variable is not set.")
        sys.exit(1)

    try:
        scraper_function = load_scraper(scraper_name)
    except ValueError as e:
        print(e)
        sys.exit(1)

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
        raw_table_data_list = scraper_function(crud)

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
                    sys.exit(1)

            except Exception as e:
                print(f"Error processing table data: {e}")
                sys.exit(1)

    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)
    finally:
        db.disconnect()
        print("Database connection closed")

    sys.exit(0)

if __name__ == '__main__':
    main()
