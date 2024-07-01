import requests
import os


def save_picture(image_url, save_path):
    """
    Downloads an image from the web and saves it to the specified path.
    
    Args:
        image_url (str): URL of the image to be downloaded.
        save_path (str): Path where the image will be saved.
    """
    try:
        # Send a GET request to the image URL
        response = requests.get(image_url, stream=True)
        response.raise_for_status()  # Check if the request was successful
        
        # Open a local file with write-binary mode
        with open(save_path, 'wb') as file:
            # Write the content of the response to the file in chunks
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        
        print(f"Image successfully downloaded: {save_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the image: {e}")

# Add more generalized utility functions as needed
