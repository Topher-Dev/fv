from utils import retry_request, validate_html_response, validate_json_response, headers
from bs4 import BeautifulSoup

def fetch_ufcevent_urls(view_display_id, page=0):
    base_url = "https://www.ufc.com/views/ajax"
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

    response = retry_request(base_url, params=params, headers=headers)
    data = validate_json_response(response, ['0', '1', '2', '3'])

    html_content=""

    for item in data:
        if item in ["0", "1", "2", "3"]:
            print("Handling case where data is embedded further in the tree: " + item)
            item=json_response[item]

        if 'data' not in item:
            continue

        if item['data'] is None:
            #print("Handling case where no data in response")
            continue

        if item.get('command') == 'insert':
            #print("html content has been found")
            html_content += item['data']
    
    return html_content

def parse_ufcevent_urls(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    events = soup.select('div.c-card-event--result__info')
    
    if not events:
        raise ValueError("No events found in the HTML content")

    event_links = []
    for event in events:
        h3 = event.select_one('h3.c-card-event--result__headline')
        event_links.append({
            'web_url': h3.find('a')['href'] if h3 else '',
            'name': h3.text.strip() if h3 else ''
        })
    
    return event_links

def ufcevent_1(crud):
    upcoming_html = fetch_ufcevent_urls('upcoming')
    past_html = fetch_ufcevent_urls('past')
    event_links = parse_ufcevent_urls(upcoming_html) + parse_ufcevent_urls(past_html)
    
    return [{
        "table": "ufc_event",
        "data": event_links,
        "instructions": {
            "unique": ["web_url"]
        }
    }]
