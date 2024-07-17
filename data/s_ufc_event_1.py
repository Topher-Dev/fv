from utils import retry_request, validate_html_response, validate_json_response, headers
from bs4 import BeautifulSoup
from datetime import datetime
import sys

def fetch_ufcevent_urls(view_display_id, max_pages=1):
    base_url = "https://www.ufc.com/views/ajax"
    event_links = []
    page = 0

    while True:
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

        try:
            response = retry_request(base_url, params=params, headers=headers)
            data = validate_json_response(response)
        except Exception as e:
            print(f"Failed to fetch data for view_display_id {view_display_id} on page {page}: {e}")
            break

        print(response.text[:100])

        html_content = ""

        for item in data:
            if item in ["0", "1", "2", "3"]:
                item = data[item]

            if 'data' not in item:
                continue

            if item['data'] is None:
                continue

            if item.get('command') == 'insert':
                html_content += item['data']

        if not html_content:
            print(f"No HTML content found for view_display_id {view_display_id} on page {page}.")
            break

        page_event_links = parse_ufcevent_urls(html_content)
        if not page_event_links:
            print(f"No events found for view_display_id {view_display_id} on page {page}.")
            break

        event_links.extend(page_event_links)
        page += 1

        # Break out of the loop after max_pages iterations for testing
        if page >= max_pages:
            break

    return event_links

def parse_ufcevent_urls(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    events = soup.select('div.c-card-event--result__info')
    
    if not events:
        raise ValueError("No events found in the HTML content")

    event_links = []
    for event in events:
        h3 = event.select_one('h3.c-card-event--result__headline a')
        event_date_div = event.select_one('div.c-card-event--result__date')

        if not h3 or not event_date_div:
            continue

        event_url = h3['href']
        event_name = h3.text.strip()
        main_card_timestamp = event_date_div.get('data-main-card-timestamp')
        prelims_card_timestamp = event_date_div.get('data-prelims-card-timestamp')
        timezone = event_date_div.get('data-format', '').split()[-1]

        # Convert timestamps to PostgreSQL compatible format
        main_card = datetime.utcfromtimestamp(int(main_card_timestamp)).strftime('%Y-%m-%d %H:%M:%S') if main_card_timestamp else None
        prelims_card = datetime.utcfromtimestamp(int(prelims_card_timestamp)).strftime('%Y-%m-%d %H:%M:%S') if prelims_card_timestamp else None

        event_links.append({
            'web_url': event_url,
            'name': event_name,
            'main_card': main_card,
            'prelims_card': prelims_card,
            'timezone': timezone
        })
    
    return event_links

def ufcevent_1(crud):
    try:
        # Set max_pages to 1 for testing
        upcoming_event_links = fetch_ufcevent_urls('upcoming', max_pages=1)
        past_event_links = fetch_ufcevent_urls('past', max_pages=1)
        event_links = upcoming_event_links + past_event_links

        if len(event_links) == 0:
            sys.exit(1)
            #raise ValueError("No events found from ufc source, trying backup")

    except Exception as e:
        print(f"Failed to fetch UFC event URLs: {e}")
        return []

    return [{
        "table": "ufc_event",
        "data": event_links,
        "instructions": {
            "unique": ["web_url"]
        }
    }]
