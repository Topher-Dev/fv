from utils import retry_request, validate_json_response, headers

def fetch_fight_details(fight_fmid):
    base_url = 'https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/'
    url = f"{base_url}{fight_fmid}.json"
    response = retry_request(url, headers=headers)
    data = validate_json_response(response, ['LiveFightDetail'])
    return data['LiveFightDetail']

def ufcfight_1(crud):
    fights_pending_data = crud.read_list("ufc_fight", {'status': 'pending_data'})
    if not fights_pending_data:
        print("No fights with pending data status found.")
        return []

    fight_pd = fights_pending_data[0]  # Process first fight only for simplicity
    fight_data = fetch_fight_details(fight_pd['fmid'])
    fighters = [{
        "fmid": fighter['FighterId'],
        "data": json.dumps(fighter),
        "status": "pending_imgs"
    } for fighter in fight_data['Fighters']]

    return [
        {
            "table": "ufc_fight",
            "data": [{
                "id": fight_pd['id'],
                "status": "pending_fighter_extract",
                "data": json.dumps(fight_data)
            }],
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
