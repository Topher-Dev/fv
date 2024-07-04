import requests
from utils import save_picture, headers
import os
import re
from requests.exceptions import RequestException
import time
from datetime import datetime
from bs4 import BeautifulSoup
import json

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
        "ajax_page_state[libraries]": "x"
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
                    print("Handling case where data is embedded further in the tree: " + item)
                    item=json_response[item]

                if 'data' not in item:
                    print("no data found in json_response")
                    continue


                if item['data'] is None:
                    print("Handling case where no data in response")
                    continue


                if item.get('command') == 'insert':
                    print("html content has been found")
                    html_content += item['data']

            if html_content == "":
                print(f"No HTML content found for view_display_id {view_display_id} on page {params['page']}.")

            # Save JSON response to a file for examination
            filename = f"ufc_event_{view_display_id}_page_{params['page']}.json"
            with open(filename, 'w') as json_file:
                json.dump(json_response, json_file, indent=4)

 
            soup = BeautifulSoup(html_content, 'html.parser')
            events = soup.find_all('div', class_='c-card-event--result__info')

            if not events:
                print(f"No events found for view_display_id {view_display_id} on page {params['page']}.")
                break

            for event in events:
                event_data = {}
                h3 = event.find('h3', class_='c-card-event--result__headline')
                event_data['web_url'] = h3.find('a')['href'] if h3 else ''
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
        print(f"Event Name: {event['name']} - Web Link: {event['web_url']}")

    return event_links

def scrape_event_urls():
    upcoming = gather_ufcevent_urls('upcoming')
    past = gather_ufcevent_urls('past')

    #concatenate the two lists
    all_events = upcoming + past
    return all_events


def ufcevent_1(crud):
    return [{
        "table": "ufc_event",
        "data": scrape_event_urls(),
        "instructions": {
            "unique": ["web_url"]
        }
    }]
