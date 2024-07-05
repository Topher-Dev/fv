from bs4 import BeautifulSoup
from utils import retry_request, validate_html_response, headers

def fetch_event_data(event_url):
    base_url = 'https://ufc.com'
    url = base_url + event_url
    response = retry_request(url, headers=headers)
    validate_html_response(response, ['script[data-drupal-selector="drupal-settings-json"]'])
    return response.text

def parse_event_data(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    script_tag = soup.select_one('script[data-drupal-selector="drupal-settings-json"]')
    settings = json.loads(script_tag.string)
    event_fmid = settings.get('eventLiveStats', {}).get('event_fmid')
    if not event_fmid:
        raise ValueError("event_fmid not found in event data")

    return event_fmid

def parse_fight_data(html_content, event_id):
    soup = BeautifulSoup(html_content, 'html.parser')
    fight_list_items = soup.select('li.l-listing__item')
    fights = []

    for item in fight_list_items:
        fight_div = item.select_one('div.c-listing-fight[data-fmid]')
        if fight_div:
            fights.append({
                'fmid': fight_div['data-fmid'],
                'fighter_1_url': fight_div.select_one('div.c-listing-fight__corner--red a')['href'].split('com')[1],
                'fighter_2_url': fight_div.select_one('div.c-listing-fight__corner--blue a')['href'].split('com')[1],
                'event_id': event_id
            })

    if not fights:
        raise ValueError("No fights found in the HTML content")

    return fights

def ufcevent_2(crud):
    events_pending_fmids = crud.read_list("ufc_event", {'status': 'pending_fmid'})
    if not events_pending_fmids:
        print("No events with pending FMIDs found.")
        return []

    event_pf = events_pending_fmids[0]  # Process first event only for simplicity
    html_content = fetch_event_data(event_pf['web_url'])
    event_fmid = parse_event_data(html_content)
    fights = parse_fight_data(html_content, event_pf['id'])

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
