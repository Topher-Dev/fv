import requests
from scraper_utils import save_picture
import os
from requests.exceptions import RequestException
import time
from bs4 import BeautifulSoup

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


headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
}

def gather_ufcevent_urls(view_display_id, page=0):

    base_url = "https://www.ufc.com/views/ajax"

    # Query parameters
    params = {
        "view_name": "events_upcoming_past_solr",
        "view_display_id": view_display_id,
        "view_args": "",
        "view_path": "/events",
        "view_dom_id": "582d24e69b70e6ec0a512bb91f4cd456b13610417b6dbe1a4820df89100de108",
        "pager_element": "0",
        "page": page,
        "ajax_page_state[theme]": "ufc",
        "ajax_page_state[theme_token]": "",
        "ajax_page_state[libraries]": "eJx1kQFyhCAMRS8Ey0V6ByZCVLZZ4pDg1p6-FHS6005nHP3_RfEngRiVIR8OTnGbC2c1E4R3r9yuzb1of5d_S4ofauKObk8R2cwJKfqlcN0cEj4w623lkj7b8UBeYRKzMC-EHjLQoSmI-w0MwcFVfUwSeMdyOM4YmMzGRC6WugHdvrWllN_FyCGKjxZL0NQ5uKmqcpauA5RoQ_t7S2JnZsXyw3Fv9LJcBambOVF7zTaLYZQX4gnIBpFXex9uxcJD8NMq2ydoWF_O_ottH1AvpmwhaOLcXe_HxsJb5OdAbYTVPiANt8EyepQ27gmKnVMRPYnia4fdrwjx9H32TfgeQdx4vKXxuZ_TsuoGIg6q9pXBFcsTB6ATuILLxY-2fCcIJay-hTF7wqe4fr89OFbCgTzc4cMvqO4SJ095Trnl9BLK9247tRe1g34BunMJCA"
    }


    event_links = []

    while True:
        try:
            # Sending the request
            response = requests.get(base_url, params=params, headers=headers)
            time.sleep(.5)  # Sleep for 1 second to avoid rate limiting
            response.raise_for_status()  # Raise an error for bad status codes


            # Checking the response
            json_response = response.json()

            html_content = ""

            # Loop through the JSON array to find the item with command="insert"
            for item in json_response:

                #make sure we can use the .get method on the item
                if item in ["0", "1", "2", "3"]:
                    item=json_response[item]

                if item.get('command') == 'insert':
                    html_content += item['data']

            if not html_content:
                print(json_response)
                print(f"No HTML content found for view_display_id {view_display_id} on page {params['page']}.")
                break

            soup = BeautifulSoup(html_content, 'html.parser')
            events = soup.find_all('div', class_='c-card-event--result__info')

            if not events:
                print(f"No events found for view_display_id {view_display_id} on page {params['page']}.")
                break

            for event in events:
                event_data = {}
                h3 = event.find('h3', class_='c-card-event--result__headline')
                event_data['web_link'] = h3.find('a')['href'] if h3 else ''
                event_data['name'] = h3.text.strip() if h3 else ''
                event_links.append(event_data)

            # Process the valid event links
            print(f"Successfully processed page {params['page']} for view_display_id {view_display_id}. Found: {len(event_links)} links")
            params['page'] += 1  # Increment the page number for the next iteration

            if params['page'] >= 3:
                print(f"test break 3")
                break

        except RequestException as e:
            print(f"Network request failed for view_display_id {view_display_id} on page {params['page']}: {e}")
            break
        except ValueError as e:
            print(f"Failed to parse JSON response for view_display_id {view_display_id} on page {params['page']}: {e}")
            break


    
    for event in event_links:
        print(f"Event Name: {event['name']} - Web Link: {event['web_link']}")

    return event_links

def scrape_event_urls():
    upcoming = gather_ufcevent_urls('upcoming')
    past = gather_ufcevent_urls('past')

    #concatenate the two lists
    all_events = upcoming + past
    return all_events


def ufcevent_1():
    return [{
        "table": "ufcevent",
        "data": scrape_event_urls(),
        "instructions": {
            "unique": ["web_link"]
        }
    }]