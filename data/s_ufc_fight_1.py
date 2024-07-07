import json
from utils import retry_request, validate_json_response, headers

def fetch_fight_details(fight_fmid):
    base_url = 'https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/'
    url = f"{base_url}{fight_fmid}.json"
    response = retry_request(url, headers=headers)
    data = validate_json_response(response, ['LiveFightDetail'])
    return data['LiveFightDetail']

def ufcfight_1(crud, max_fights=None):
    fights_pending_data = crud.read_list("ufc_fight", {'status': 'pending_data'})
    if not fights_pending_data:
        print("No fights with pending data status found.")
        return []

    fights_update_data = []
    fighters = []
    fights_processed = 0

    for fight_pd in fights_pending_data:
        fight_data = fetch_fight_details(fight_pd['fmid'])
        fights_update_data.append({
            "id": fight_pd['id'],
            "status": "pending_fighter_extract",
            "data": json.dumps(fight_data)
        })

        fighters.extend([{
            "fmid": fighter['FighterId'],
            "data": json.dumps(fighter),
            "status": "pending_imgs"
        } for fighter in fight_data['Fighters']])

        fights_processed += 1
        if max_fights and fights_processed >= max_fights:
            break

    return [
        {
            "table": "ufc_fight",
            "data": fights_update_data,
            "instructions": {
                "unique": ["id"]
            }
        },
        {
            "table": "ufc_fighter",
            "data": fighters,
            "instructions": {
                "unique": ["fmid"]
            }
        }
    ]
