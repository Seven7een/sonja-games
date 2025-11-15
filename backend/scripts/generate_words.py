#!/usr/bin/env python3
"""
Script to generate words.json from online word list.
Downloads 5-letter words and creates a JSON file for the Wordle game.
"""
import json
import urllib.request

WORD_LIST_URL = "https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_alpha.txt"
OUTPUT_FILE = "app/games/wordle/words.json"

def download_and_filter_words():
    """Download word list and filter for 5-letter words."""
    print(f"Downloading word list from {WORD_LIST_URL}...")
    
    with urllib.request.urlopen(WORD_LIST_URL) as response:
        content = response.read().decode('utf-8')
    
    # Filter for 5-letter words only
    words = [word.strip().lower() for word in content.split('\n') 
             if len(word.strip()) == 5 and word.strip().isalpha()]
    
    print(f"Found {len(words)} five-letter words")
    return sorted(set(words))  # Remove duplicates and sort

def main():
    words = download_and_filter_words()
    
    # Create JSON structure
    # Use all words for both answers and valid_guesses
    # The daily word will be selected using a hash function
    data = {
        "answers": words,
        "valid_guesses": words
    }
    
    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✓ Generated {OUTPUT_FILE}")
    print(f"  - {len(data['answers'])} answer words")
    print(f"  - {len(data['valid_guesses'])} valid guess words")

if __name__ == "__main__":
    main()
