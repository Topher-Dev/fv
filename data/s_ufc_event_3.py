import json
from utils import retry_request, validate_json_response, headers

def fetch_event_details(event_fmid):
    base_url = 'https://d29dxerjsp82wz.cloudfront.net/api/v3/event/live/'
    url = f"{base_url}{event_fmid}.json"
    response = retry_request(url, headers=headers)
    data = validate_json_response(response, ['LiveEventDetail'])
    return data

def ufcevent_3(crud, max_events=None):
    events_pending_data = crud.read_list("ufc_event", {'status': 'pending_data'})
    if not events_pending_data:
        print("No events with pending FMIDs found.")
        return []

    events_update_data = []
    events_processed = 0

    for event_pd in events_pending_data:
        event_data = fetch_event_details(event_pd['fmid'])
        events_update_data.append({
            "id": event_pd['id'],
            "status": "completed",
            "data": json.dumps(event_data)
        })

        events_processed += 1
        if max_events and events_processed >= max_events:
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
