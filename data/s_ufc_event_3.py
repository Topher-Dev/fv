from utils import retry_request, validate_json_response, headers

def fetch_event_details(event_fmid):
    base_url = 'https://d29dxerjsp82wz.cloudfront.net/api/v3/event/live/'
    url = f"{base_url}{event_fmid}.json"
    response = retry_request(url, headers=headers)
    data = validate_json_response(response, ['LiveEventDetail'])
    return data

def ufcevent_3(crud):
    events_pending_data = crud.read_list("ufc_event", {'status': 'pending_data'})
    if not events_pending_data:
        print("No events with pending FMIDs found.")
        return []

    event_pd = events_pending_data[0]  # Process first event only for simplicity
    event_data = fetch_event_details(event_pd['fmid'])

    return [
        {
            "table": "ufc_event",
            "data": [{
                "id": event_pd['id'],
                "status": "completed",
                "data": json.dumps(event_data)
            }],
            "instructions": {
                "unique": ["id"]
            }
        }
    ]
