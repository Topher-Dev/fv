from bs4 import BeautifulSoup
from utils import retry_request, validate_html_response, headers

table_mappings = {
    'Past_events': {'name_col': 1, 'url_col': 1},
    'Scheduled_events': {'name_col': 0, 'url_col': 0}
}

def get_indices_for_id(table_id):
    if table_id in table_mappings:
        mapping = table_mappings[table_id]
        return mapping['name_col'], mapping['url_col']
    else:
        return 1, 1

def fetch_wiki_event_urls():
    base_url = "https://en.wikipedia.org/wiki/List_of_UFC_events"
    response = retry_request(base_url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    validate_html_response(response, ['table.wikitable'])
    return soup

def parse_wiki_event_urls(soup, max_events=10):
    event_links = []
    tables = soup.select('table.wikitable')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows[1:]:
            columns = row.find_all(['td', 'th'])
            if len(columns) < 2:
                continue
            table_id = table.get('id')
            name_col, url_col = get_indices_for_id(table_id)
            event_name = columns[name_col].text.strip()
            event_url = columns[url_col].find('a')['href'] if columns[url_col].find('a') else None
            if event_url and 'http' not in event_url:
                event_url = 'https://en.wikipedia.org' + event_url
            event_data = {'name': event_name, 'wiki_url': event_url}
            event_links.append(event_data)
            if len(event_links) >= max_events:
                break
        if len(event_links) >= max_events:
            break
    return event_links

def fetch_ufc_event_url(event_data):
    response = retry_request(event_data['wiki_url'], headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    validate_html_response(response, ['li[id^="cite_note-"]'])
    ufc_url = None
    list_items = soup.select('li[id^="cite_note-"]')
    for li in list_items:
        if li.find('a', href=re.compile(r'https://www.ufc.com/event')):
            ufc_url = li.find('a', href=re.compile(r'https://www.ufc.com/event')).get('href')
            ufc_url = ufc_url.split('com')[1]
            break
    if not ufc_url:
        raise ValueError(f"UFC.com URL not found in {event_data['wiki_url']}")
    event_data['ufc_url'] = ufc_url
    return event_data

def wikievent_1(crud):
    max_events_to_scrape = 15
    soup = fetch_wiki_event_urls()
    events = parse_wiki_event_urls(soup, max_events=max_events_to_scrape)

    events_to_save = []
    for event in events:
        print(event)
        if event.get('wiki_url'):
            try:
                event = fetch_ufc_event_url(event)
                events_to_save.append({
                    "web_url": event['ufc_url'],
                    "status": "pending_fmid",
                    "name": event['name']
                })
            except ValueError as e:
                print(e)
                continue

    return [{
        "table": "ufc_event",
        "data": events_to_save,
        "instructions": {
            "unique": ["web_url"]
        }
    }]
