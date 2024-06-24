import requests
from scraper_utils import save_picture
import os

def ufcfighterpage_fighter():
    raw_table_data_list = []
    base_url = "http://www.ufc.com/api/v1/fighter_resource.json"
    print(f"Fetching data from {base_url}")
    response = requests.get(base_url)
    content = response.json()

    # Specific parsing logic for fighter data
    fighter_data = []
    for index, item in enumerate(content):
        try:
            fighter = {
                'name': item.get('name'),
                'age': item.get('age'),
                'picture_url': item.get('picture_url')
            }
            # Save picture
            if 'picture_url' in fighter:
                save_path = os.path.join('/path/to/save/pictures', f"{fighter['name']}.jpg")
                print(f"Saving picture for {fighter['name']} to {save_path}")
                save_picture(fighter['picture_url'], save_path)
                fighter['picture_path'] = save_path
            fighter_data.append(fighter)
        except Exception as e:
            print(f"Failed on {index + 1}/{len(content)}, URL: {base_url}")
            print(f"Error: {e}")

    raw_table_data_list.append({
        'table': 'fighter',
        'data': fighter_data,
        'instructions': {
            'transform': {
                'name': 'transform_name',
                'age': 'transform_age'
            },
            'validate': {
                'name': 'validate_name',
                'age': 'validate_age'
            },
            'unique': ['name']  # Example unique field
        }
    })

    print(f"Fetched and parsed data for {len(fighter_data)} fighters")
    return raw_table_data_list

def ufceventpage_event():
    raw_table_data_list = []
    base_url = "http://www.ufc.com/api/v1/event_resource.json"
    page_number = 1
    event_data = []

    while True:
        url = f"{base_url}?page={page_number}"
        print(f"Fetching data from {url}")
        response = requests.get(url)
        content = response.json()

        # Break loop if no more data
        if not content:
            print(f"No more data found at {url}")
            break

        # Specific parsing logic for event data
        for index, item in enumerate(content):
            try:
                event = {
                    'event_name': item.get('event_name'),
                    'event_date': item.get('event_date')
                }
                event_data.append(event)
            except Exception as e:
                print(f"Failed on {index + 1}/{len(content)}, URL: {url}")
                print(f"Error: {e}")

        print(f"Fetched and parsed data for page {page_number}")
        page_number += 1

    raw_table_data_list.append({
        'table': 'event',
        'data': event_data,
        'instructions': {
            'transform': {
                'event_name': 'transform_name',
                'event_date': 'transform_date'
            },
            'validate': {
                'event_name': 'validate_name',
                'event_date': 'validate_date'
            },
            'unique': ['event_name']  # Example unique field
        }
    })

    print(f"Fetched and parsed data for {len(event_data)} events")
    return raw_table_data_list

def load_scraper(scraper_name):
    try:
        scraper_function = globals()[scraper_name]
        return scraper_function
    except KeyError:
        raise ValueError(f"Scraper function '{scraper_name}' not found.")
