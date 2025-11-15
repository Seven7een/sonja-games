# Backend Scripts

## generate_words.py

Generates the `words.json` file for the Wordle game from an online word list.

### Usage

```bash
# From project root
make generate-words

# Or directly
docker-compose -f docker-compose.dev.yml exec backend python scripts/generate_words.py
```

### How it works

1. Downloads the English words list from https://github.com/dwyl/english-words
2. Filters for 5-letter words only
3. Creates a JSON file with both `answers` and `valid_guesses` arrays
4. Stores the file at `app/games/wordle/words.json`

### Daily Word Selection

The daily word is selected using a cryptographic hash (SHA-256) of the date + a secret key. This ensures:

- **Deterministic**: All servers get the same word for the same date
- **Unpredictable**: The sequence can't be guessed without knowing the secret
- **Secure**: The word list doesn't need to be kept secret

Set the `WORDLE_SECRET` environment variable to customize the selection sequence.

### Word List Stats

- Source: ~370,000 English words
- Filtered: ~15,900 five-letter words
- All words are valid for both answers and guesses
