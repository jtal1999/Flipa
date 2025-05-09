import requests
import json
from datetime import datetime
import time
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Get API key from environment variable
SERPAPI_KEY = os.getenv('SERPAPI_KEY')
if not SERPAPI_KEY:
    raise ValueError("SERPAPI_KEY not found in environment variables")

# Image URL to search for
IMAGE_URL = "https://i.imgur.com/8VmjcR5.png"

def is_amazon_result(match):
    """Check if the result is from Amazon"""
    source = match.get('source', '').lower()
    link = match.get('link', '').lower()
    return 'amazon' in source or 'amazon' in link

def search_lens():
    """Search Google Lens for similar images"""
    url = "https://serpapi.com/search.json"
    
    params = {
        "engine": "google_lens",
        "url": IMAGE_URL,
        "api_key": SERPAPI_KEY
    }
    
    try:
        print(f"\nSearching Google Lens for image: {IMAGE_URL}")
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        data = response.json()
        
        # Save raw results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"lens_results_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\nResults saved to {filename}")
        
        # Print summary of results
        if 'visual_matches' in data:
            matches = data['visual_matches']
            amazon_matches = [m for m in matches if is_amazon_result(m)]
            print(f"\nFound {len(amazon_matches)} Amazon matches out of {len(matches)} total matches")
            
            # Print all Amazon matches
            for i, match in enumerate(amazon_matches, 1):
                print(f"\nAmazon Match {i}:")
                print(f"Title: {match.get('title', 'N/A')}")
                print(f"Source: {match.get('source', 'N/A')}")
                print(f"Link: {match.get('link', 'N/A')}")
                if 'thumbnail' in match:
                    print(f"Thumbnail: {match['thumbnail']}")
                if 'price' in match:
                    print(f"Price: {match['price'].get('value', 'N/A')}")
                print("-" * 80)  # Separator line between matches
            
            if not amazon_matches:
                print("\nNo Amazon matches found in the results")
        else:
            print("No visual matches found in the response")
            
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response text: {e.response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def main():
    print("Starting Google Lens search...")
    results = search_lens()
    
    if results:
        print("\nSearch completed successfully!")
    else:
        print("\nSearch failed. Please check the error messages above.")

if __name__ == "__main__":
    main() 