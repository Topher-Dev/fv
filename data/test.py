import requests
from bs4 import BeautifulSoup
from db import Database

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
}

#script 1: sync our database with the urls for each ufc event. they look like "https://www.ufc.com/event/ufc-fight-night-june-22-2024"

#scropt 2: request each url and scrape the event_fmid and the fight_fmid for each page and load into database.

#script 3: sync out events table utilizing the event_fmid

#script 4: sync out fights table utilizing the fight_fmid

#script 5: sync out fighters table utilizing the fighter_page_url

#1
def gather_ufcevent_upcoming_urls(db):
    base_url = "https://www.ufc.com/events"
    response = requests.get(base_url,headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')

    upcoming_events_div = soup.find('details', id='events-list-upcoming')

    event_urls = []
    for div in soup.find_all('div', class_='c-card-event--result__logo'):
        a_tag = div.find('a', href=True)
        if a_tag:
            event_urls.append("https://www.ufc.com" + a_tag['href'])
    print(event_urls)
    print(len(event_urls))
    return event_urls

def external_id_sync(view_display_id, page=0):

    page=0
    id_type='url'
    id_for='event_ufc'
    source = "ufc_ajax"
    external_ufc_event_ids=[]
    base_url = "https://www.ufc.com/views/ajax"

    # Query parameters
    params = {
        "view_name": "events_upcoming_past_solr",
        "view_display_id": view_display_id,
        "view_args": "",
        "view_path": "/events",
        "view_base_path": "",
        "view_dom_id": "582d24e69b70e6ec0a512bb91f4cd456b13610417b6dbe1a4820df89100de108",
        "pager_element": "0",
        "page": page,
        "ajax_page_state[theme]": "ufc",
        "ajax_page_state[theme_token]": "",
        "ajax_page_state[libraries]": "eJx1kQFyhCAMRS8Ey0V6ByZCVLZZ4pDg1p6-FHS6005nHP3_RfEngRiVIR8OTnGbC2c1E4R3r9yuzb1of5d_S4ofauKObk8R2cwJKfqlcN0cEj4w623lkj7b8UBeYRKzMC-EHjLQoSmI-w0MwcFVfUwSeMdyOM4YmMzGRC6WugHdvrWllN_FyCGKjxZL0NQ5uKmqcpauA5RoQ_t7S2JnZsXyw3Fv9LJcBambOVF7zTaLYZQX4gnIBpFXex9uxcJD8NMq2ydoWF_O_ottH1AvpmwhaOLcXe_HxsJb5OdAbYTVPiANt8EyepQ27gmKnVMRPYnia4fdrwjx9H32TfgeQdx4vKXxuZ_TsuoGIg6q9pXBFcsTB6ATuILLxY-2fCcIJay-hTF7wqe4fr89OFbCgTzc4cMvqO4SJ095Trnl9BLK9247tRe1g34BunMJCA"
    }

    #while True:
        # Sending the request
    response = requests.get(base_url, params=params, headers=headers)

    # Checking the response
    json_response = response.json()

    html_content=""

    # Loop through the JSON array to find the item with command="insert"
    for item in json_response:
        if item.get('command') == 'insert':
            html_content+=item['data']
            break

    soup = BeautifulSoup(html_content, 'html.parser')

    event_links = []
    events = soup.find_all('div', class_='c-card-event--result__info')

    for event in events:
        event_name = event.find('h3', class_='c-card-event--result__headline')
        event_link = event_name.find('a')['href'] if event_name else ''
        event_links.append(event_link)


    print(event_links)
external_id_sync('upcoming')

#gather_ufcevent_upcoming_urls('db')
