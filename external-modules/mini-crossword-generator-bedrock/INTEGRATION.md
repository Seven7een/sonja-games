# Integration with Minigame Platform

This document explains how the CDK infrastructure integrates with the minigame platform backend.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  CDK Stack (This Project)               │
│  ┌───────────────────────────────────┐  │
│  │ IAM User + Access Key             │  │
│  │ - bedrock:InvokeModel permission  │  │
│  └───────────────────────────────────┘  │
│              │                           │
│              │ Outputs credentials       │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │ Environment Variables             │  │
│  │ - AWS_ACCESS_KEY_ID               │  │
│  │ - AWS_SECRET_ACCESS_KEY           │  │
│  │ - AWS_REGION                      │  │
│  │ - BEDROCK_MODEL_ID                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    │ Configure in Railway
                    ▼
┌─────────────────────────────────────────┐
│  Minigame Platform Backend              │
│  ┌───────────────────────────────────┐  │
│  │ app/config.py                     │  │
│  │ - Reads environment variables     │  │
│  └───────────────────────────────────┘  │
│              │                           │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │ app/games/crossword/              │  │
│  │   bedrock_client.py               │  │
│  │ - boto3 client wrapper            │  │
│  └───────────────────────────────────┘  │
│              │                           │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │ app/games/crossword/              │  │
│  │   generator_service.py            │  │
│  │ - Calls Bedrock to generate       │  │
│  │ - Validates output                │  │
│  │ - Stores in database              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    │ Invokes model
                    ▼
┌─────────────────────────────────────────┐
│  AWS Bedrock                            │
│  - Claude 3 Haiku                       │
│  - Generates crossword puzzles          │
└─────────────────────────────────────────┘
```

## Backend Integration Code

### 1. Configuration (app/config.py)

```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... existing settings ...
    
    # AWS Bedrock Configuration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    BEDROCK_MODEL_ID: str = os.getenv(
        "BEDROCK_MODEL_ID", 
        "anthropic.claude-3-haiku-20240307-v1:0"
    )
    CROSSWORD_MAX_RETRIES: int = int(os.getenv("CROSSWORD_MAX_RETRIES", "3"))

settings = Settings()
```

### 2. Bedrock Client (app/games/crossword/bedrock_client.py)

```python
import json
import boto3
from botocore.exceptions import ClientError
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class BedrockClient:
    """Wrapper for AWS Bedrock API calls."""
    
    def __init__(self):
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.model_id = settings.BEDROCK_MODEL_ID
    
    def invoke_model(self, prompt: str, max_tokens: int = 2000) -> dict:
        """
        Invoke Bedrock model with prompt.
        Returns parsed JSON response.
        
        Args:
            prompt: The prompt to send to the model
            max_tokens: Maximum tokens in response
            
        Returns:
            dict: Parsed JSON response from model
            
        Raises:
            ClientError: If Bedrock API call fails
            json.JSONDecodeError: If response is not valid JSON
        """
        try:
            # Format request for Claude models
            if "claude" in self.model_id:
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": max_tokens,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.7,
                })
            elif "llama" in self.model_id:
                body = json.dumps({
                    "prompt": prompt,
                    "max_gen_len": max_tokens,
                    "temperature": 0.7,
                })
            else:
                raise ValueError(f"Unsupported model: {self.model_id}")
            
            # Invoke model
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=body,
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            # Extract text based on model
            if "claude" in self.model_id:
                text = response_body['content'][0]['text']
            elif "llama" in self.model_id:
                text = response_body['generation']
            else:
                raise ValueError(f"Unsupported model response format")
            
            # Parse JSON from text
            return json.loads(text)
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Bedrock API error: {error_code} - {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse model response as JSON: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Bedrock: {e}")
            raise

# Singleton instance
bedrock_client = BedrockClient()
```

### 3. Generator Service (app/games/crossword/generator_service.py)

```python
from app.games.crossword.bedrock_client import bedrock_client
from botocore.exceptions import ClientError
import asyncio
import logging

logger = logging.getLogger(__name__)

CROSSWORD_GENERATION_PROMPT = """
Generate a mini crossword puzzle with these requirements:

GRID SPECIFICATIONS:
- Maximum 5x5 grid
- Use "." for black/empty cells
- Use uppercase letters for answer cells
- Words must intersect logically at shared letters
- Minimum 3 words across and 3 words down
- Words can include proper nouns, puns, slang, and creative wordplay as long as clues are clear

CLUE REQUIREMENTS:
- Write clever, concise clues (5-15 words each)
- Clues should be challenging but fair
- Use wordplay, definitions, or cultural references
- Number clues starting from top-left, reading left-to-right, top-to-bottom

OUTPUT FORMAT (JSON):
{
  "grid": [
    ["A", "H", "A", ".", "."],
    ["S", "W", "A", "N", "."],
    ["B", "O", "A", "R", "D"],
    ["O", "N", "K", "E", "Y"],
    ["A", "G", "E", "S", "."]
  ],
  "clues_across": {
    "1": "___ moment (instance when inspiration strikes)",
    "4": "With 4 down, term for a farewell performance",
    "5": "Get on a ship",
    "6": "Not out of tune",
    "7": "Years and years"
  },
  "clues_down": {
    "1": "No longer slumbering",
    "2": "Rabbits long eared relatives",
    "3": "Warhol known for his soup can art",
    "4": "See 4 across",
    "5": "Constricting snake"
  },
  "answers_across": {
    "1": "AHA",
    "4": "SWAN",
    "5": "BOARD",
    "6": "ONKEY",
    "7": "AGES"
  },
  "answers_down": {
    "1": "AWAKE",
    "2": "HARES",
    "3": "WARHOL",
    "4": "SONG",
    "5": "BOA"
  }
}

Generate a unique, creative crossword puzzle now. Return ONLY the JSON, no other text.
"""

async def call_llm_for_crossword(max_retries: int = 3) -> dict:
    """
    Calls AWS Bedrock to generate crossword puzzle.
    Retries on failure with exponential backoff.
    """
    for attempt in range(max_retries):
        try:
            # Call Bedrock (synchronous, but wrapped in async)
            puzzle_data = await asyncio.to_thread(
                bedrock_client.invoke_model,
                CROSSWORD_GENERATION_PROMPT
            )
            
            # Validate structure
            is_valid, error = validate_crossword_structure(puzzle_data)
            if is_valid:
                logger.info("Successfully generated crossword puzzle")
                return puzzle_data
            
            logger.warning(f"Validation failed (attempt {attempt + 1}): {error}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Bedrock API error (attempt {attempt + 1}): {error_code}")
            
            # Retry on throttling or service errors
            if error_code in ['ThrottlingException', 'ServiceUnavailableException']:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
            else:
                # Don't retry on auth or validation errors
                break
        
        except Exception as e:
            logger.error(f"Unexpected error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
    
    # All retries failed
    logger.error("Failed to generate valid crossword after all retries")
    raise CrosswordGenerationError("Failed to generate valid crossword")

def validate_crossword_structure(data: dict) -> tuple[bool, str]:
    """
    Validates LLM-generated crossword data.
    Returns (is_valid, error_message)
    """
    # Check required fields
    required_fields = ["grid", "clues_across", "clues_down", "answers_across", "answers_down"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate grid
    grid = data["grid"]
    if not isinstance(grid, list) or len(grid) == 0:
        return False, "Grid must be a non-empty list"
    
    if len(grid) > 5 or any(len(row) > 5 for row in grid):
        return False, "Grid exceeds 5x5 maximum"
    
    # Validate all cells are single characters or "."
    for row in grid:
        for cell in row:
            if not isinstance(cell, str) or len(cell) != 1:
                return False, "Grid cells must be single characters"
            if cell not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ.":
                return False, f"Invalid grid cell: {cell}"
    
    # Validate clues and answers are dictionaries
    for field in ["clues_across", "clues_down", "answers_across", "answers_down"]:
        if not isinstance(data[field], dict):
            return False, f"{field} must be a dictionary"
    
    # Validate minimum word count
    if len(data["answers_across"]) < 3 or len(data["answers_down"]) < 3:
        return False, "Must have at least 3 words across and 3 words down"
    
    return True, ""

class CrosswordGenerationError(Exception):
    """Raised when crossword generation fails."""
    pass
```

## Dependencies

Add to `backend/requirements.txt`:

```txt
boto3>=1.28.0
```

## Environment Variables

Set in Railway (or `.env` for local development):

```bash
# From CDK stack outputs
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Optional
CROSSWORD_MAX_RETRIES=3
```

## Testing Locally

1. Deploy CDK stack and get credentials
2. Add credentials to `.env` file
3. Start backend: `docker-compose -f docker-compose.dev.yml up`
4. Test generation:

```python
# In Python shell or test file
from app.games.crossword.generator_service import call_llm_for_crossword
import asyncio

puzzle = asyncio.run(call_llm_for_crossword())
print(puzzle)
```

## Cost Tracking

Monitor usage in AWS Console:
- Bedrock → Usage
- CloudWatch → Metrics → Bedrock

Expected costs:
- ~$0.0015 per puzzle
- ~$0.045 per month (30 puzzles)

## Security Notes

1. **Never commit credentials** to git
2. **Use Railway secrets** for production
3. **Rotate access keys** every 90 days
4. **Monitor CloudTrail** for API calls
5. **Set billing alerts** in AWS Console

## Troubleshooting

### "Access Denied" Error

1. Verify credentials are correct
2. Check IAM policy is attached to user
3. Verify model access is enabled in Bedrock console
4. Ensure region matches

### "Model Not Found" Error

1. Check model ID is correct
2. Verify model is available in your region
3. Ensure model access is enabled

### "Throttling" Error

The retry logic should handle this automatically. If persistent:
1. Reduce generation frequency
2. Request quota increase in AWS Console

### Invalid JSON Response

1. Check prompt formatting
2. Verify model is returning JSON
3. Add better error handling in parsing

## Next Steps

After integration:
1. ✅ CDK stack deployed
2. ✅ Credentials configured
3. ✅ Backend code integrated
4. → Test puzzle generation
5. → Implement fallback mechanism
6. → Add to crossword service
7. → Deploy to production
