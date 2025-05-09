from serpapi.google_search import GoogleSearch
import json
from datetime import datetime
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

def get_products_token():
    """Get the products page token from initial search"""
    params = {
        "engine": "google_lens",
        "url": IMAGE_URL,
        "api_key": SERPAPI_KEY,
        "hl": "en",  # English language
        "country": "us"  # US region for better product results
    }
    
    try:
        print(f"\nGetting products token for image: {IMAGE_URL}")
        search = GoogleSearch(params)
        results = search.get_dict()
        
        if 'products_page_token' in results:
            return results['products_page_token']
        else:
            print("No products page token found in the response")
            return None
            
    except Exception as e:
        print(f"Error getting products token: {e}")
        return None

def search_products(page_token):
    """Search for products using the page token"""
    params = {
        "engine": "google_lens",
        "page_token": page_token,
        "api_key": SERPAPI_KEY
    }
    
    try:
        print("\nSearching for products...")
        search = GoogleSearch(params)
        results = search.get_dict()
        
        # Save raw results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"lens_products_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nResults saved to {filename}")
        
        # Process and display results
        if 'visual_matches' in results:
            matches = results['visual_matches']
            amazon_matches = [m for m in matches if is_amazon_result(m)]
            print(f"\nFound {len(amazon_matches)} Amazon product matches out of {len(matches)} total matches")
            
            # Print all Amazon matches with detailed information
            for i, match in enumerate(amazon_matches, 1):
                print(f"\nAmazon Product {i}:")
                print(f"Title: {match.get('title', 'N/A')}")
                print(f"Source: {match.get('source', 'N/A')}")
                print(f"Link: {match.get('link', 'N/A')}")
                
                # Print rating information if available
                if 'rating' in match:
                    print(f"Rating: {match['rating']}/5")
                if 'reviews' in match:
                    print(f"Number of Reviews: {match['reviews']}")
                
                # Print price information if available
                if 'price' in match:
                    price_info = match['price']
                    print(f"Price: {price_info.get('value', 'N/A')}")
                    if 'extracted_value' in price_info:
                        print(f"Extracted Price: {price_info['extracted_value']}")
                    if 'currency' in price_info:
                        print(f"Currency: {price_info['currency']}")
                
                # Print availability information
                if 'in_stock' in match:
                    print(f"In Stock: {'Yes' if match['in_stock'] else 'No'}")
                if 'condition' in match:
                    print(f"Condition: {match['condition']}")
                
                # Print image information
                if 'thumbnail' in match:
                    print(f"Thumbnail: {match['thumbnail']}")
                if 'image' in match:
                    print(f"Full Image: {match['image']}")
                
                print("-" * 80)  # Separator line between matches
            
            if not amazon_matches:
                print("\nNo Amazon products found in the results")
                
        else:
            print("No product matches found in the response")
            
        return results
        
    except Exception as e:
        print(f"Error during product search: {e}")
        return None

def main():
    print("Starting Google Lens product search...")
    
    # First get the products page token
    products_token = get_products_token()
    
    if products_token:
        # Then search for products using the token
        results = search_products(products_token)
        
        if results:
            print("\nProduct search completed successfully!")
        else:
            print("\nProduct search failed. Please check the error messages above.")
    else:
        print("\nFailed to get products token. Please check the error messages above.")

if __name__ == "__main__":
    main() 