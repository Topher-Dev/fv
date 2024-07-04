import requests
from utils import save_picture, headers
import os
import re
from requests.exceptions import RequestException
import time
from datetime import datetime
from bs4 import BeautifulSoup
import json

def ufcevent_2(crud):
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

