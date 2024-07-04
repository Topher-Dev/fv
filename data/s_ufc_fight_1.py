def ufcfight_1(crud):

    fights_pending_data=crud.read_list("ufc_fight", { 'status' : 'pending_data'})

    #loop through
    base_url='https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/'

    #handle the case where the fights_pending_data list is empty
    if not fights_pending_data:
        print("No fights with pending data status found.")
        return []
    else:
        print(f"Found {len(fights_pending_data)} fights with pending data status.")

    fights_update_data = []

    fighters =[]

    for fight_pd in fights_pending_data:

        url = base_url + str(fight_pd['fmid']) + '.json'
        print(url)
        response = requests.get(url=url, headers=headers)

        # Parse JSON response
        fight_data = response.json()['LiveFightDetail']

        fights_update_data.append({
            "id": fight_pd['id'],
            "status": "pending_fighter_extract",
            "data": json.dumps(fight_data)
        })
        
        #pretty print the json properly
        print(json.dumps(fight_data, indent=4))

        for fighter in fight_data['Fighters']:
            print(fighter)
            fighters.append({
                "fmid": fighter['FighterId'],
                "data": json.dumps(fighter),
                "status": "pending_imgs"
            })

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
