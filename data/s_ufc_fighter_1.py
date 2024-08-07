import os
import json
from bs4 import BeautifulSoup
from utils import retry_request, validate_html_response, headers, save_picture

def fetch_fighter_data(fighter_url):
    base_url = 'https://ufc.com'
    url = base_url + fighter_url
    print(f"[FetchFighterData] Fetching fighter data from URL: {url}")
    response = retry_request(url, headers=headers)
    validate_html_response(response, ['div.hero-profile'])
    return response.text


def parse_fighter_data(html_content):
    try:
        print(f"[ParseFighterData] Parsing fighter data")
        soup = BeautifulSoup(html_content, 'html.parser')

        # Extract fighter details
        fighter_name_tag = soup.select_one('h1.hero-profile__name')
        if not fighter_name_tag:
            raise ValueError(f"[ParseFighterData] Fighter name tag not found")
        fighter_name = fighter_name_tag.get_text(strip=True)
        
        # Split the fighter's name into parts and convert to lowercase for comparison
        name_parts = [part.lower() for part in fighter_name.split()]

        head_img_url = "ufc.com/../themes/custom/ufc/assets/img/no-profile-image.png"  # Default image URL
        head_img_tags = soup.select('img.image-style-event-results-athlete-headshot')
        
        print(f"[ParseFighterData] Checking {len(head_img_tags)} headshot images")

        # Loop through each headshot image to find a matching URL
        for img_tag in head_img_tags:
            img_src = img_tag['src']
            # Convert img_src to lowercase for comparison
            img_src_lower = img_src.lower()

            if img_tag.has_attr('alt'):
                img_src_lower += " " + img_tag['alt'].lower()

            # Check if all parts of the fighter's name are in the image src
            if all(part in img_src_lower for part in name_parts):
                head_img_url = img_src  # Store the original URL
                print(f"[ParseFighterData] Found matching image URL: {head_img_url}")
                break
        else:
            print(f"[ParseFighterData] No matching image URL found, using default URL: {head_img_url}")

        nickname_tag = soup.select_one('p.hero-profile__nickname')
        nickname = nickname_tag.get_text(strip=True) if nickname_tag else ""

        division_tag = soup.select_one('div.hero-profile__division p.hero-profile__division-title')
        division = division_tag.get_text(strip=True) if division_tag else ""

        record_tag = soup.select_one('div.hero-profile__division p.hero-profile__division-body')
        record = record_tag.get_text(strip=True) if record_tag else ""

        stats_tags = soup.select('div.hero-profile__stat')
        stats = {stat.select_one('p.hero-profile__stat-text').get_text(strip=True): 
                 stat.select_one('p.hero-profile__stat-numb').get_text(strip=True) 
                 for stat in stats_tags}

        return {
            "head_img_url": head_img_url,
            "fighter_name": fighter_name,
            "nickname": nickname,
            "division": division,
            "record": record,
            "stats": stats
        }
    except Exception as e:
        raise ValueError(f"[ParseFighterData] Error parsing fighter data: {e}")

def save_fighter_image(head_img_url, fighter_name):
    try:
        base_dir = '/srv/images/fighter/headshot'
        os.makedirs(base_dir, exist_ok=True)
        
        img_path = os.path.join(base_dir, f"{fighter_name}.png")
        
        # Check if image already exists before downloading
        if not os.path.exists(img_path):
            save_picture(head_img_url, img_path)
        
        print(f"[SaveFighterImage] Fighter image saved for {fighter_name}")
        return img_path
    except Exception as e:
        print(f"[SaveFighterImage] Error saving fighter image: {e}")
        return None

def ufcfighter_1(crud):
    print("[UFCFighter1] Starting scraper for UFC Fighter 1")
    fighters_pending_imgs = crud.read_list("ufc_fighter", {'status': 'pending_imgs'})
    if not fighters_pending_imgs:
        print("[UFCFighter1] No fighters with pending images found.")
        return []

    all_fighter_updates = []
    fighters_processed = 0

    for fighter in fighters_pending_imgs:
        try:
            html_content = fetch_fighter_data(fighter['web_url'])
            fighter_data = parse_fighter_data(html_content)
           
            fighter_name = fighter['web_url'].split("/")[-1]
            print(fighter_name)
            head_img_path = save_fighter_image(fighter_data['head_img_url'], fighter_name)
            if head_img_path is None:
                print(f"[UFCFighter1] Skipping fighter {fighter_name}, image not saved")
                continue

            all_fighter_updates.append({
                "id": fighter['id'],
                "status": "complete",
                "data2": json.dumps(fighter_data),
            })

            fighters_processed += 1
        except Exception as e:
            print(f"[UFCFighter1] Error processing fighter {fighter['web_url']}: {e}")
            continue

    print(f"[UFCFighter1] Scraper completed for UFC Fighter 1. Processed {fighters_processed} fighters.")
    return [
        {
            "table": "ufc_fighter",
            "data": all_fighter_updates,
            "instructions": {
                "unique": ["id"]
            }
        }
    ]


if __name__ == "__main__":
    from db import Database
    from crud import CRUD

    # Example usage
    db = Database(host='localhost', database='mydb', user='user', password='password')
    crud = CRUD(db)
    db.connect()

    try:
        fighter_updates = ufcfighter_1(crud)
        for update in fighter_updates:
            table = update['table']
            data = update['data']
            instructions = update['instructions']
            print(f"Updating table {table} with {len(data)} records")
            crud.update_list(table, data, instructions)
    finally:
        db.disconnect()
