from utils import retry_request, validate_html_response, validate_json_response, headers
from bs4 import BeautifulSoup
from datetime import datetime
import sys
import requests

def fetch_ufcfighters(max_pages=1):


    base_url = "https://www.ufc.com/views/ajax"
    all_fighters = []
    page = 1

    # Create a session
    session = requests.Session()

    # Set headers for the session
    session.headers.update(headers)

    # Make an initial request to get the cookies 
    initial_response = session.get('https://www.ufc.com/')
    print("Initial request status code:", initial_response.status_code)

    # Check the cookies received
    print("Cookies set by initial request:", session.cookies.get_dict())

    while True:
        print(f"Getting fighter content for page: {page}")
        params = {
            'view_name': 'all_athletes',
            'view_display_id': 'page',
            'view_args': '',
            'view_path': '/athletes/all',
            'view_base_path': '',
            'view_dom_id': '612d2b3eb350709e3b51ad198423cd72b9609e5166b86445dfb9937740c7b0aa',
            'pager_element': '0',
            'page': page,
            'ajax_page_state[theme]': 'ufc',
            'ajax_page_state[theme_token]': '',
            'ajax_page_state[libraries]': 'eJx1UgFuwyAM_FAIT0IOOITWwRF22mavH4FUq6ZNiqK7w9icbQhBGfJh4QLjXDjrMIG_O-X6bfYDu5v8e6T4qvdQFYvD18aCwc2JKhULew2SfVrTvyERMxagITzQPlJAHmbwqGJD2TegsbORUr6bZwoR9e-AR8KnGLjBa4jMkdBBBjo0-VrjlzAQHLyrC0k8P7AcljN6pmFjonfeE5uzrAxyiOJaXQsO--zttKtyloY9lGB87R1mNTNzNdX07s8IEnptSiSegIwX-aS3zlohEwpvgZ_5kkRTjgZ0IdReecW8mxVSj9ggdllq4yYoZk5F9FIUP5_T-IIQLv7ESQvmIIY3TWv6aonc1VpBKH6p_daltuCcXjtMcdENpM114ZK-QBO3pzhiD3QJtmB86z2T_YEjELnLUrPujrpAV0VXTQxtkrb9x5XDTtgldw7X1QWwb3DpKc8pV39OfDkH2FfhrZqufgPAkiUs'
        }

        try:
            response = session.get(base_url, params=params)
            print(response.text[:100])
            data = validate_json_response(response)
        except Exception as e:
            print(f"Failed to fetch data for view_display_id {view_display_id} on page {page}: {e}")
            break

        html_content = ""

        for item in data:
            if item in ["0", "1", "2", "3"]:
                item = data[item]

            if 'data' not in item:
                continue

            if item['data'] is None:
                continue

            if item.get('command') == 'insert':
                html_content += item['data']

        if not html_content:
            print(f"No HTML content found for view_display_id {view_display_id} on page {page}.")
            break
 
        fighters = parse_ufcfighters(html_content)
        if not fighters:
            print(f"No fighters found on page {page}.")
            break

        all_fighters.extend(fighters)
        page += 1

        # Break out of the loop after max_pages iterations for testing
        if page >= max_pages:
            break

    return all_fighters


def parse_ufcfighters(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    fighters_html = soup.select('div.c-listing-athlete-flipcard__inner')
    if not fighters_html:
        raise ValueError("No fighters found in the HTML content")

    fighters = []
    for fighter_html in fighters_html:
        name = fighter_html.select_one('span.c-listing-athlete__name').text.strip()
        print(name)

        try:
            head_shot_src = fighter_html.select_one('img.image-style-teaser')['src'].strip()
            print(head_shot_src)
        except:
            head_shot_src = None
            print(f"No headshot for {name}")
        # Extract the social links
        social_links = {}
        for link in fighter_html.find_all('a', class_='c-listing-athlete-flipcard__social-link'):
            href = link.get('href')
            svg_title = link.find('svg').find('title').text.lower()
            social_links[svg_title] = href

        # Print the extracted links
        print(social_links)

        fighters.append(name)

    return fighters

def ufcfighter_2(crud):
    try:
        # Set max_pages to 1 for testing
        fighters = fetch_ufcfighters(max_pages=3)
#        event_links = upcoming_event_links + past_event_links
#
#        if len(event_links) == 0:
#            sys.exit(1)
            #raise ValueError("No events found from ufc source, trying backup")

    except Exception as e:
#        print(f"Failed to fetch UFC event URLs: {e}")
        return []

    return []

#    return [{
#        "table": "ufc_event",
#        "data": event_links,
#        "instructions": {
#            "unique": ["web_url"]
#        }
#    }]
