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
    'page': '1',
    'ajax_page_state[theme]': 'ufc',
    'ajax_page_state[theme_token]': '',
    'ajax_page_state[libraries]': 'eJx1UgFuwyAM_FAIT0IOOITWwRF22mavH4FUq6ZNiqK7w9icbQhBGfJh4QLjXDjrMIG_O-X6bfYDu5v8e6T4qvdQFYvD18aCwc2JKhULew2SfVrTvyERMxagITzQPlJAHmbwqGJD2TegsbORUr6bZwoR9e-AR8KnGLjBa4jMkdBBBjo0-VrjlzAQHLyrC0k8P7AcljN6pmFjonfeE5uzrAxyiOJaXQsO--zttKtyloY9lGB87R1mNTNzNdX07s8IEnptSiSegIwX-aS3zlohEwpvgZ_5kkRTjgZ0IdReecW8mxVSj9ggdllq4yYoZk5F9FIUP5_T-IIQLv7ESQvmIIY3TWv6aonc1VpBKH6p_daltuCcXjtMcdENpM114ZK-QBO3pzhiD3QJtmB86z2T_YEjELnLUrPujrpAV0VXTQxtkrb9x5XDTtgldw7X1QWwb3DpKc8pV39OfDkH2FfhrZqufgPAkiUs'
}

# Headers reflecting the provided info
headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-CA,en;q=0.9',
    'Cookie': 'STYXKEY_region=CANADA.CA.en-can.Default; _ga=GA1.2.1478160183.1721157862; _gid=GA1.2.2126678548.1721157862; _fbp=fb.1.1721157862282.873999704622840039; _tt_enable_cookie=1; _ttp=kihkU6MWtqL1tYKbtu7UV-5WhKi; __qca=P0-1052801903-1721157862165; OptanonAlertBoxClosed=2024-07-16T19:24:25.722Z; __gads=ID=5d04a69ffb7b1c0d:T=1721157861:RT=1721162073:S=ALNI_MasGsDNQ96hcZFTbeA0Z_ahmKTBsQ; __gpi=UID=00000a42409b06c6:T=1721157861:RT=1721162073:S=ALNI_MZQ4mYDC1pdhFBcAAsLmodbIHD65w; __eoi=ID=2142889b8898ec82:T=1721157861:RT=1721162073:S=AA-AfjbsGFLIZKTmaWQ5j98Cb9h8; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Jul+16+2024+17%3A34%3A33+GMT-0300+(Atlantic+Daylight+Time)&version=202401.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=30f7f93c-56c2-4dcf-b632-9f000b2d8b31&interactionCount=1&landingPath=NotLandingPage&groups=1%3A1%2C2%3A0%2C4%3A0&geolocation=CA%3BNS&AwaitingReconsent=false',
    'Dnt': '1',
    'If-Modified-Since': 'Tue, 16 Jul 2024 19:25:29 GMT',
    'If-None-Match': 'W/"1721157929"',
    'Priority': 'u=0, i',
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}

# Base URL
base_url = 'https://www.ufc.com/views/ajax'

# Make the GET request
response = requests.get(base_url, params=params, headers=headers)

# Print the response
print(response.text[:300])
#print(response.json())
