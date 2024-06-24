import requests
import os

def save_picture(url, save_path):
    print(f"Downloading image from {url}")
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(save_path, 'wb') as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)
        print(f"Image saved to {save_path}")
        return save_path
    else:
        raise Exception(f"Failed to download image from {url}")

# Add more generalized utility functions as needed
