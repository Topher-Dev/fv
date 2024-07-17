import requests

# Parameters extracted from the URL
params = {
    'view_name': 'all_athletes',
    'view_display_id': 'page',
    'view_args': '',
    'view_path': '/athletes/all',
    'view_base_path': '',
    'view_dom_id': '612d2b3eb350709e3b51ad198423cd72b9609e5166b86445dfb9937740c7b0aa',
    'pager_element': '0',
    'page': '2',
    'ajax_page_state[theme]': 'ufc',
    'ajax_page_state[theme_token]': '',
    'ajax_page_state[libraries]': 'eJx1UgFuwyAM_FAIT0IOOITWwRF22mavH4FUq6ZNiqK7w9icbQhBGfJh4QLjXDjrMIG_O-X6bfYDu5v8e6T4qvdQFYvD18aCwc2JKhULew2SfVrTvyERMxagITzQPlJAHmbwqGJD2TegsbORUr6bZwoR9e-AR8KnGLjBa4jMkdBBBjo0-VrjlzAQHLyrC0k8P7AcljN6pmFjonfeE5uzrAxyiOJaXQsO--zttKtyloY9lGB87R1mNTNzNdX07s8IEnptSiSegIwX-aS3zlohEwpvgZ_5kkRTjgZ0IdReecW8mxVSj9ggdllq4yYoZk5F9FIUP5_T-IIQLv7ESQvmIIY3TWv6aonc1VpBKH6p_daltuCcXjtMcdENpM114ZK-QBO3pzhiD3QJtmB86z2T_YEjELnLUrPujrpAV0VXTQxtkrb9x5XDTtgldw7X1QWwb3DpKc8pV39OfDkH2FfhrZqufgPAkiUs'
}

# Headers reflecting the provided info
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}

# Base URL
base_url = 'https://www.ufc.com/views/ajax'

# Create a session
session = requests.Session()

# Set headers for the session
session.headers.update(headers)

# Make an initial request to get the cookies
initial_response = session.get('https://www.ufc.com/')
print("Initial request status code:", initial_response.status_code)

# Check the cookies received
print("Cookies set by initial request:", session.cookies.get_dict())

# Use the same session to make the request with parameters and dynamic cookies
response = session.get(base_url, params=params)

# Print the response
print(response.text[:300])
# Uncomment the following line if the response is JSON
# print(response.json())
