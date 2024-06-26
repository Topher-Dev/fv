import requests
from bs4 import BeautifulSoup
import time
import datetime
import json

import requests
from bs4 import BeautifulSoup

def fetch_events(page=1):
    url = "https://www.ufc.com/views/ajax"
    params = {
        "view_name": "events_upcoming_past_solr",
        "view_display_id": "upcoming",
        "view_args": "",
        "view_path": "/events",
        "view_base_path": "",
        "view_dom_id": "your_view_dom_id",  # Replace with the correct view_dom_id
        "pager_element": 0,
        "page": page,
        "ajax_page_state[theme]": "ufc",
        # ... other ajax_page_state params ...
    }

    response = requests.get(url, params=params)
    print(response)
    return response.json()

def fetch_event_details(event):
    url = 'https://www.ufc.com' + event['link']
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Get the details for each event by using the '.c-listing-fight__content' class which will return a list of all the fights
    fights = soup.find_all('div', class_='c-listing-fight__content')

    # Create a list to store the fight data
    fight_data = []

    # Loop through each fight and extract the data
    for fight in fights:
        fight_detail = {}
        
        # Extract weight class
        fight_detail['weight_class'] = fight.find('div', class_='c-listing-fight__class-text').text.strip() if fight.find('div', class_='c-listing-fight__class-text') else "Unknown"
        
        # Extract fighter names and profile links
        fighters = fight.find_all('div', class_='c-listing-fight__corner-name')
        if fighters:
            fight_detail['fighter_1_name'] = fighters[0].get_text(strip=True)
            fight_detail['fighter_1_link'] = fighters[0].find('a')['href'] if fighters[0].find('a') else "No link"
            fight_detail['fighter_2_name'] = fighters[1].get_text(strip=True)
            fight_detail['fighter_2_link'] = fighters[1].find('a')['href'] if fighters[1].find('a') else "No link"
        
        # Extract fight odds, if present
        odds = fight.find('div', class_='c-listing-fight__odds-wrapper')
        if odds:
            fight_detail['odds'] = odds.get_text(strip=True)
        else:
            fight_detail['odds'] = "No odds information"
        
        # Extract country flags and names
        countries = fight.find_all('div', class_='psql')
        if countries:
            fight_detail['fighter_1_country'] = countries[0].get_text(strip=True)
            fight_detail['fighter_2_country'] = countries[1].get_text(strip=True)
        
        fight_data.append(fight_detail)
    
    return fight_data



def parse_event_data(json_response):
    html_content = json_response[1]['data']
    soup = BeautifulSoup(html_content, 'html.parser')

    events_data = []
    events = soup.find_all('div', class_='c-card-event--result__info')

    for event in events:
        event_data = {}

        event_name = event.find('h3', class_='c-card-event--result__headline')
        event_date = event.find('div', class_='c-card-event--result__date')
        event_location = event.find('div', class_='c-card-event--result__location')

        #the <a> tag is nested inside the <h3> tag
        event_link = event_name.find('a')['href'] if event_name else ''

        event_data['name'] = event_name.text.strip() if event_name else 'N/A'
        event_data['date'] = event_date.text.strip() if event_date else 'N/A'
        event_data['location'] = event_location.text.strip() if event_location else 'N/A'
        event_data['link'] = event_link.strip() if event_link else 'N/A'

        print(event_data)

        events_data.append(event_data)

    return events_data

def fetch_all_events():
    all_events = []
    page = 1

    while True:
        response_json = fetch_events(page)
        events = parse_event_data(response_json)
        if not events:
            break  # No more events, exit loop
        all_events.extend(events)
        page += 1

    return all_events



def main():
    db = Database()
    events = fetch_all_events()
    print(f'Fetched {len(events)} events')
    for event in events:
        db.upsert('event', event)


if __name__ == '__main__':
    print("Starting scrape...")
    #test retrieving one page and parsing it
    response = fetch_events()
    events = parse_event_data(response)
    print(events)