import os
import json
from bs4 import BeautifulSoup
from utils import retry_request, validate_html_response, headers, save_picture

def fetch_event_data(event_url):
    base_url = 'https://ufc.com'
    url = base_url + event_url
    print(f"[FetchEventData] Fetching event data from URL: {url}")
    response = retry_request(url, headers=headers)
    validate_html_response(response, ['script[data-drupal-selector="drupal-settings-json"]'])
    return response.text

def parse_event_data(html_content):
    try:
        print(f"[ParseEventData] Parsing event data")
        soup = BeautifulSoup(html_content, 'html.parser')
        script_tag = soup.select_one('script[data-drupal-selector="drupal-settings-json"]')
        settings = json.loads(script_tag.string)
        event_fmid = settings.get('eventLiveStats', {}).get('event_fmid')
        if not event_fmid:
            print("[ParseEventData] event_fmid not found")
            return None
        return event_fmid
    except Exception as e:
        raise ValueError(f"[ParseEventData] Error parsing event data: {e}")

def parse_fight_data(html_content, event_id):
    try:
        print(f"[ParseFightData] Parsing fight data for event ID: {event_id}")
        soup = BeautifulSoup(html_content, 'html.parser')
        fight_list_items = soup.select('li.l-listing__item')
        fights = []

        for item in fight_list_items:
            fight_div = item.select_one('div.c-listing-fight[data-fmid]')
            if fight_div:
                try:
                    fighter_1_url = fight_div.select_one('div.c-listing-fight__corner--red a')['href']
                    fighter_2_url = fight_div.select_one('div.c-listing-fight__corner--blue a')['href']
                except Exception as e:
                    print(f"[ParseFightData] Error extracting fighter URLs: {e}")
                    continue
                
                try:
                    fights.append({
                        'fmid': fight_div['data-fmid'],
                        'fighter_1_url': fighter_1_url.split('com')[1],
                        'fighter_2_url': fighter_2_url.split('com')[1],
                        'event_id': event_id
                    })

                    # Save fighter images
                    save_fighter_images(fight_div, fighter_1_url, fighter_2_url)
                except Exception as e:
                    print(f"[ParseFightData] Error appending fight data: {e}")
                    continue
        
        if not fights:
            print("[ParseFightData] No fights found")
            return None

        return fights
    except Exception as e:
        raise ValueError(f"[ParseFightData] Error parsing fight data: {e}")

def save_fighter_images(fight_div, fighter_1_url, fighter_2_url):
    try:
        base_dir = os.path.join(os.getenv('APP_GIT_ROOT'), 'web/client/imgs')
        os.makedirs(base_dir, exist_ok=True)

        # Fighter images
        fighter_1_img_url = fight_div.select_one('div.c-listing-fight__corner--red img')['src']
        fighter_2_img_url = fight_div.select_one('div.c-listing-fight__corner--blue img')['src']
        fighter_1_name = fighter_1_url.split('/')[-1]
        fighter_2_name = fighter_2_url.split('/')[-1]
        fighter_1_img_path = os.path.join(base_dir, f"{fighter_1_name}.png")
        fighter_2_img_path = os.path.join(base_dir, f"{fighter_2_name}.png")

        # Check if images already exist before downloading
        if not os.path.exists(fighter_1_img_path):
            save_picture(fighter_1_img_url, fighter_1_img_path)
        if not os.path.exists(fighter_2_img_path):
            save_picture(fighter_2_img_url, fighter_2_img_path)

        # Flag images
        flag_red_url = fight_div.select_one('div.c-listing-fight__country--red img')['src']
        flag_blue_url = fight_div.select_one('div.c-listing-fight__country--blue img')['src']
        flag_red_name = flag_red_url.split('/')[-1]
        flag_blue_name = flag_blue_url.split('/')[-1]
        flag_red_path = os.path.join(base_dir, flag_red_name)
        flag_blue_path = os.path.join(base_dir, flag_blue_name)

        # Check if flags already exist before downloading
        if not os.path.exists(flag_red_path):
            save_picture(flag_red_url, flag_red_path)
        if not os.path.exists(flag_blue_path):
            save_picture(flag_blue_url, flag_blue_path)
    except Exception as e:
        print(f"[SaveFighterImages] Error saving fighter images: {e}")

def ufcevent_2(crud, max_events=None):
    print("[UFCEvent2] Starting scraper for UFC Event 2")
    events_pending_fmids = crud.read_list("ufc_event", {'status': 'pending_fmid'})
    if not events_pending_fmids:
        print("[UFCEvent2] No events with pending FMIDs found.")
        return []

    all_fights = []
    all_event_updates = []
    events_processed = 0

    for event_pf in events_pending_fmids:
        try:
            html_content = fetch_event_data(event_pf['web_url'])
            event_fmid = parse_event_data(html_content)

            if event_fmid is None:
                print(f"[UFCEvent2] Skipping event {event_pf['name']} (ID: {event_pf['id']}), no event_fmid found yet")
                continue

            fights = parse_fight_data(html_content, event_pf['id'])

            if fights is None:
                print(f"[UFCEvent2] Skipping event {event_pf['name']} (ID: {event_pf['id']}), no fights found yet")
                continue

            all_fights.extend(fights)
            all_event_updates.append({
                "web_url": event_pf['web_url'],
                "status": "pending_data",
                "fmid": event_fmid
            })

            events_processed += 1
            if max_events and events_processed >= max_events:
                break
        except Exception as e:
            print(f"[UFCEvent2] Error processing event {event_pf['name']} (ID: {event_pf['id']}): {e}")
            continue

    print(f"[UFCEvent2] Scraper completed for UFC Event 2. Processed {events_processed} events.")
    return [
        {
            "table": "ufc_fight",
            "data": all_fights
        },
        {
            "table": "ufc_event",
            "data": all_event_updates,
            "instructions": {
                "unique": ["web_url"]
            }
        }
    ]
