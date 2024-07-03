import requests
from utils import save_picture
from s_wiki_event import ufcevent_3
import os
import re
from requests.exceptions import RequestException
import time
from datetime import datetime
from bs4 import BeautifulSoup
import json

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


def ufcfight_1(crud):
    #read all the pending fmids
    events_pending_fmids=crud.read_list("ufc_event", { 'status' : 'pending_fmid'})

    #loop through
    base_url='https://ufc.com'

    #handle the case where the events_pending_fmids list is empty
    if not events_pending_fmids:
        print("No events with pending FMIDs found.")
        return []

    for event_pf in events_pending_fmids:

        url = base_url + event_pf['web_url']
        print(url)
        #make the request
        # Fetch the HTML content 
        response = requests.get(url)
        time.sleep(.5)
        html_content = response.text

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')

        # Find the script tag containing JSON data
        script_tag = soup.find('script', attrs={'data-drupal-selector': 'drupal-settings-json'})

        if script_tag:
            # Extract the JSON data
            json_data = script_tag.string
    
            # Parse JSON string to dictionary
            settings = json.loads(json_data)
    
            # Extract event_fmid
            event_fmid = settings.get('eventLiveStats', {}).get('event_fmid')

            if event_fmid:
                 print(f'event_fmid found: {event_fmid}')
            else:
                 print('event_fmid not found in JSON data')
        else:
            print('Script tag not found')

        #parse out the fmid with bs4

        #update the record with fmid and update status


        #get all the fights
        # Find all <li> tags with class "l-listing__item"
        fight_list_items = soup.find_all('li', class_='l-listing__item')

        # Initialize an empty list to store fight details
        fights = []

        # Loop through each <li> tag found
        for item in fight_list_items:
                # Find <div> tag with class "c-listing-fight"
                fight_div = item.find('div', class_='c-listing-fight', attrs={'data-fmid': True})
                
                if fight_div:

                        print(fight_div.prettify())
                        # Extract data-fmid attribute
                        data_fmid = fight_div['data-fmid']
                        
                        # Find <a> tags for fighter_1 and fighter_2 URLs
                        fighter_1_url = fight_div.find('div', class_='c-listing-fight__corner--red').find('a')['href']
                        fighter_2_url = fight_div.find('div', class_='c-listing-fight__corner--blue').find('a')['href']
                        
                        #strip the base url
                        fighter_1_url = fighter_1_url.split('com')[1]
                        fighter_2_url = fighter_2_url.split('com')[1]


                        # Append fight details to the list
                        fights.append({
                                'fmid': data_fmid,
                                'fighter_1_url': fighter_1_url,
                                'fighter_2_url': fighter_2_url,
                                'event_id': event_pf['id']
                        })

        # Print the list of fights
        for fight in fights:
                print(f"Fight FMID: {fight['fmid']}")
                print(f"Fighter 1 URL: {fight['fighter_1_url']}")
                print(f"Fighter 2 URL: {fight['fighter_2_url']}")

        #loop through them and extract fight_fmid, fighter_1_url, fighter_2_url

	#create fight record with above and ufc_event_id

    return [
        {
            "table": "ufc_fight",
            "data": fights
        },
        {
            "table": "ufc_event",
            "data": [{
                "web_url": event_pf['web_url'],
                "status": "pending_data",
                "fmid": event_fmid
            }],
            "instructions": {
                "unique": ["web_url"]
            }
        }
    ]


def ufcevent_2(crud):
    #read all the pending fmids
    events_pending_data=crud.read_list("ufc_event", { 'status' : 'pending_data'})

    #loop through
    base_url='https://d29dxerjsp82wz.cloudfront.net/api/v3/event/live/'

    #handle the case where the events_pending_data list is empty
    if not events_pending_data:
        print("No events with pending FMIDs found.")
        return []
    

    events_update_data = []

    for event_pd in events_pending_data:

        url = base_url + str(event_pd['fmid']) + '.json'
        print(url)
        response = requests.get(url=url, headers=headers)

        # Parse JSON response
        event_data = response.json()

        events_update_data.append({
            "id": event_pd['id'],
            "status": "completed",
            "data": json.dumps(event_data)
        })

        break


    return [
        {
            "table": "ufc_event",
            "data": events_update_data,
            "instructions": {
                "unique": ["id"]
            }
        }
    ]

def ufcfight_2(crud):

    fights_pending_data=crud.read_list("ufc_fight", { 'status' : 'pending_data'})

    #loop through
    base_url='https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/'

    #handle the case where the fights_pending_data list is empty
    if not fights_pending_data:
        print("No fights with pending data status found.")
        return []
    else:
        print(f"Found {len(fights_pending_data)} fights with pending data status.")

    fights_update_data = []

    fighters =[]

    for fight_pd in fights_pending_data:

        url = base_url + str(fight_pd['fmid']) + '.json'
        print(url)
        response = requests.get(url=url, headers=headers)

        # Parse JSON response
        fight_data = response.json()['LiveFightDetail']

        fights_update_data.append({
            "id": fight_pd['id'],
            "status": "pending_fighter_extract",
            "data": json.dumps(fight_data)
        })
        
        #pretty print the json properly
        print(json.dumps(fight_data, indent=4))

        for fighter in fight_data['Fighters']:
            print(fighter)
            fighters.append({
                "fmid": fighter['FighterId'],
                "data": json.dumps(fighter),
                "status": "pending_imgs"
            })

        break


    return [
        {
            "table": "ufc_fight",
            "data": fights_update_data,
            "instructions": {
                "unique": ["id"]
            }
        },
        {
            "table": "ufc_fighter",
            "data": fighters,
            "instructions": {
                "unique": ["fmid"]
            }
        }
    ]

def ufcfighter_1(crud):

 
    #read a list of unique fighter_urls from the ufc_fight_table
    fighters_pending_data=crud.read_list("ufc_fighter", { 'status' : 'pending_imgs'})
    fighters = []
    #loop through
    for fighter_pd in fighters_pending_data:

        #parse the json data
        fighter_data = json.loads(fighter_pd['data'])

        #make a request using the fighter_data['UFCLink']

        url = fighter_data['UFCLink']

        response = requests.get(url=url, headers=headers)

        #parse the html for hero picture and save it util function
        html_content = response.text

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')

        # find the hero picture
        hero_picture = soup.find('div', class_='c-hero__image')

        if hero_picture:
            save_picture(hero_picture['src'], f"fighter_{fighter_pd['fmid']}.jpg")

        
        fighters.append({
            "id": fighter_pd['id'],
            "status": "completed",
            "picture_path": f"fighter_{fighter_pd['fmid']}.jpg"
        })


    return [
        {
            "table": "ufc_fighter",
            "data": fighters,
            "instructions": {
                "unique": ["id"]
            }
        }
    ]


table_mappings = {
    'Past_events': {'name_col': 1, 'url_col': 1},
    'Scheduled_events': {'name_col': 0, 'url_col': 0}
}

# Function to get indices for "name" and "url" columns based on table id
def get_indices_for_id(table_id):
    # Check if table_id exists in table_mappings dictionary
    if table_id in table_mappings:
        mapping = table_mappings[table_id]
        return mapping['name_col'], mapping['url_col']
    else:
        # Return default mappings if table_id is not found
        return 1, 1

def scrape_ufc_event_urls(max_events=10):
    base_url = "https://en.wikipedia.org/wiki/List_of_UFC_events"

    # Sending the request
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(base_url, headers=headers)
    response.raise_for_status()  # Raise an error for bad status codes

    # Parsing the HTML
    soup = BeautifulSoup(response.content, 'html.parser')

    event_links = []

    # Find Scheduled events and Past events tables
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    for table in tables:
        print(table.prettify()[:100])

        rows = table.find_all('tr')
        
        for row in rows[1:]:
            columns = row.find_all(['td', 'th'])
            
            if len(columns) < 2:
                continue
            table_id = table.get('id')
            name_col, url_col = get_indices_for_id(table_id)
            event_name = columns[name_col].text.strip()
            event_url = columns[url_col].find('a')['href'] if columns[url_col].find('a') else None
            print(f"{event_name} {event_url}")
            
            if event_url and 'http' not in event_url:
                event_url = 'https://en.wikipedia.org' + event_url
            
            event_data = {'name': event_name, 'wiki_url': event_url}
            event_links.append(event_data)
            
            if len(event_links) >= max_events:
                break
        
        if len(event_links) >= max_events:
            break

    # Now fetch UFC.com event URLs from each event's Wikipedia page
    for event_data in event_links:
        if event_data['wiki_url']:
            try:
                print("Attempting to retrieve ufc/event link from: " + event_data['wiki_url'])
                response = requests.get(event_data['wiki_url'], headers=headers)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                time.sleep(.3)
                # Search for UFC.com event URLs in the page content
                ufc_url = None
                list_items = soup.find_all('li', id=re.compile(r'cite_note-\d+'))
                
                for li in list_items:
                    if li.find('a', href=re.compile(r'https://www.ufc.com/event')):
                        ufc_url = li.find('a', href=re.compile(r'https://www.ufc.com/event')).get('href')
                        ufc_url = ufc_url.split('com')[1]
                        break
                
                event_data['ufc_url'] = ufc_url
                
                print(ufc_url)
            except requests.RequestException as e:
                print(f"Failed to fetch {event_data['wiki_url']}: {e}")
                continue

    return event_links

def ufcevent_3(crud):

    # Example usage:
    max_events_to_scrape = 15
    events = scrape_ufc_event_urls(max_events=max_events_to_scrape)
    events_to_save = []

    for event in events:

        print(f"Event Name: {event['name']}")
        print(f"Wikipedia URL: {event['wiki_url']}")
        print(f"UFC.com URL: {event['ufc_url'] if 'ufc_url' in event else 'Not found'}")

        e = {}

        if event['ufc_url'] is not None:
            e['web_url']=event['ufc_url']
            e['status']='pending_fmid'
            e['name']=event['name']
            events_to_save.append(e)

    print(events_to_save)

    return [{
        "table": "ufc_event",
        "data": events_to_save,
        "instructions": {
            "unique": ["web_url"]
        }
    }]
