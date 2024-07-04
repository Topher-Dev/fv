import requests
from utils import save_picture, headers
import os
import re
from requests.exceptions import RequestException
import time
from datetime import datetime
from bs4 import BeautifulSoup
import json

def ufcevent_3(crud):
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

