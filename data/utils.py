import requests
import time
from requests.exceptions import RequestException
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
}

def retry_request(url, params=None, headers=None, max_retries=3, delay=.5, proxies=None):
    attempts = 0
    while attempts < max_retries:
        try:
            print(f"Request to url: {url}")
            response = requests.get(url, params=params, headers=headers, proxies=proxies)
            response.raise_for_status()
            return response
        except RequestException as e:
            print(f"Request failed (attempt {attempts + 1}/{max_retries}): {e}")
            attempts += 1
            time.sleep(delay)
    raise RequestException(f"Failed to fetch {url} after {max_retries} attempts")

def save_picture(url, path):
    response = retry_request(url)
    with open(path, 'wb') as file:
        file.write(response.content)
    print(f"Saved picture to {path}")

def validate_json_response(response, required_keys):
    data = response.json()
#    for key in required_keys:
#        if key not in data:
#            raise ValueError(f"Missing expected key: {key} in response from {response.url}")
    return data

def validate_html_response(response, required_selectors):
    soup = BeautifulSoup(response.content, 'html.parser')
    for selector in required_selectors:
        if not soup.select(selector):
            raise ValueError(f"Missing expected selector: {selector} in response from {response.url}")
    return soup
