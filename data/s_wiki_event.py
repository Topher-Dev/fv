import requests
from bs4 import BeautifulSoup
import re
import time

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
                        break
                
                event_data['web_url'] = ufc_url
                
                print(ufc_url)
            except requests.RequestException as e:
                print(f"Failed to fetch {event_data['wiki_url']}: {e}")
                continue

    return event_links

def ufcevent_3(crud):

    # Example usage:
    max_events_to_scrape = 15
    events = scrape_ufc_event_urls(max_events=max_events_to_scrape)

    for event in event_links:
        print(f"Event Name: {event['name']}")
        print(f"Wikipedia URL: {event['wiki_url']}")
        print(f"UFC.com URL: {event['ufc_url'] if 'ufc_url' in event else 'Not found'}")
        print()

    return [{
        "table": "ufc_event",
        "data": events,
        "instructions": {
            "unique": ["web_url"]
        }
    }]
