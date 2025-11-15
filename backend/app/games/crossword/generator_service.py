"""
Crossword puzzle generator service using AWS Bedrock.
Generates daily crossword puzzles using Claude AI model.
"""
import json
import logging
import asyncio
from typing import Dict, Tuple, Optional
from datetime import date
from sqlalchemy.orm import Session
import boto3
from botocore.exceptions import ClientError

from app.config import settings
from app.games.crossword.models import CrosswordDailyPuzzle

logger = logging.getLogger(__name__)


class BedrockClient:
    """Wrapper for AWS Bedrock API calls."""
    
    def __init__(self):
        """Initialize Bedrock client with credentials from settings."""
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
            if "claude" in self.model_id.lower():
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
            elif "llama" in self.model_id.lower():
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
            if "claude" in self.model_id.lower():
                text = response_body['content'][0]['text']
            elif "llama" in self.model_id.lower():
                text = response_body['generation']
            else:
                raise ValueError(f"Unsupported model response format")
            
            # Parse JSON from text
            # Handle cases where model wraps JSON in markdown code blocks
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
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


class CrosswordGenerationError(Exception):
    """Raised when crossword generation fails."""
    pass



def generate_crossword_prompt() -> str:
    """
    Generate structured prompt for Claude to create a 5x5 crossword puzzle.
    
    Returns:
        str: Formatted prompt for the LLM
    """
    prompt = """Generate a mini crossword puzzle with these requirements:

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

Generate a unique, creative crossword puzzle now. Return ONLY the JSON, no other text."""
    
    return prompt



def validate_crossword_structure(data: dict) -> Tuple[bool, str]:
    """
    Validates LLM-generated crossword data.
    
    Args:
        data: Dictionary containing crossword puzzle data
        
    Returns:
        Tuple of (is_valid, error_message)
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
    
    if len(grid) > 5:
        return False, f"Grid has {len(grid)} rows, exceeds 5x5 maximum"
    
    for i, row in enumerate(grid):
        if not isinstance(row, list):
            return False, f"Grid row {i} is not a list"
        if len(row) > 5:
            return False, f"Grid row {i} has {len(row)} columns, exceeds 5x5 maximum"
    
    # Validate all cells are single characters or "."
    for i, row in enumerate(grid):
        for j, cell in enumerate(row):
            if not isinstance(cell, str) or len(cell) != 1:
                return False, f"Grid cell [{i}][{j}] must be a single character, got: {cell}"
            if cell not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ.":
                return False, f"Invalid grid cell [{i}][{j}]: {cell} (must be A-Z or '.')"
    
    # Validate clues and answers are dictionaries
    for field in ["clues_across", "clues_down", "answers_across", "answers_down"]:
        if not isinstance(data[field], dict):
            return False, f"{field} must be a dictionary"
    
    # Validate minimum word count
    if len(data["answers_across"]) < 3:
        return False, f"Must have at least 3 words across, got {len(data['answers_across'])}"
    if len(data["answers_down"]) < 3:
        return False, f"Must have at least 3 words down, got {len(data['answers_down'])}"
    
    # Validate that each answer has a corresponding clue
    for num in data["answers_across"].keys():
        if num not in data["clues_across"]:
            return False, f"Answer across {num} has no corresponding clue"
    
    for num in data["answers_down"].keys():
        if num not in data["clues_down"]:
            return False, f"Answer down {num} has no corresponding clue"
    
    # Validate that answers are non-empty strings
    for num, answer in data["answers_across"].items():
        if not isinstance(answer, str) or len(answer) == 0:
            return False, f"Answer across {num} must be a non-empty string"
    
    for num, answer in data["answers_down"].items():
        if not isinstance(answer, str) or len(answer) == 0:
            return False, f"Answer down {num} must be a non-empty string"
    
    return True, ""



async def call_llm_for_crossword(max_retries: Optional[int] = None) -> dict:
    """
    Calls AWS Bedrock to generate crossword puzzle.
    Retries on failure with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts (defaults to settings.CROSSWORD_MAX_RETRIES)
        
    Returns:
        dict: Generated crossword puzzle data
        
    Raises:
        CrosswordGenerationError: If generation fails after all retries
    """
    if max_retries is None:
        max_retries = settings.CROSSWORD_MAX_RETRIES
    
    prompt = generate_crossword_prompt()
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to generate crossword (attempt {attempt + 1}/{max_retries})")
            
            # Call Bedrock (synchronous, but wrapped in async)
            puzzle_data = await asyncio.to_thread(
                bedrock_client.invoke_model,
                prompt
            )
            
            # Validate structure
            is_valid, error = validate_crossword_structure(puzzle_data)
            if is_valid:
                logger.info("Successfully generated and validated crossword puzzle")
                return puzzle_data
            
            logger.warning(f"Validation failed (attempt {attempt + 1}/{max_retries}): {error}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"Bedrock API error (attempt {attempt + 1}/{max_retries}): {error_code}")
            
            # Retry on throttling or service errors
            if error_code in ['ThrottlingException', 'ServiceUnavailableException', 'ModelTimeoutException']:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    continue
            else:
                # Don't retry on auth or validation errors
                logger.error(f"Non-retryable error: {error_code}")
                break
        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.info(f"Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
                continue
        
        except Exception as e:
            logger.error(f"Unexpected error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.info(f"Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
                continue
    
    # All retries failed
    logger.error("Failed to generate valid crossword after all retries")
    raise CrosswordGenerationError("Failed to generate valid crossword puzzle after all retry attempts")



async def generate_crossword_with_fallback(puzzle_date: date) -> Optional[dict]:
    """
    Attempts to generate a crossword puzzle using Bedrock.
    Returns None if generation fails (caller should handle gracefully).
    
    Args:
        puzzle_date: Date for the puzzle (used for logging)
        
    Returns:
        dict: Generated puzzle data, or None if generation failed
    """
    try:
        puzzle_data = await call_llm_for_crossword()
        return puzzle_data
    except CrosswordGenerationError as e:
        logger.error(f"Failed to generate crossword for {puzzle_date}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating crossword for {puzzle_date}: {e}")
        return None



async def ensure_daily_puzzle_exists(db: Session, puzzle_date: date) -> Optional[CrosswordDailyPuzzle]:
    """
    Get existing puzzle for date or generate a new one.
    Returns None if puzzle doesn't exist and generation fails.
    
    Args:
        db: Database session
        puzzle_date: Date for the puzzle
        
    Returns:
        CrosswordDailyPuzzle: The puzzle for the given date, or None if generation failed
    """
    # Check if puzzle already exists
    existing_puzzle = db.query(CrosswordDailyPuzzle).filter(
        CrosswordDailyPuzzle.date == puzzle_date
    ).first()
    
    if existing_puzzle:
        logger.info(f"Found existing puzzle for {puzzle_date}")
        return existing_puzzle
    
    # Generate new puzzle
    logger.info(f"Generating new puzzle for {puzzle_date}")
    puzzle_data = await generate_crossword_with_fallback(puzzle_date)
    
    if puzzle_data is None:
        logger.error(f"Failed to generate puzzle for {puzzle_date}")
        return None
    
    # Create and save puzzle
    new_puzzle = CrosswordDailyPuzzle(
        date=puzzle_date,
        grid_data=puzzle_data["grid"],
        clues_across=puzzle_data["clues_across"],
        clues_down=puzzle_data["clues_down"],
        answers_across=puzzle_data["answers_across"],
        answers_down=puzzle_data["answers_down"]
    )
    
    db.add(new_puzzle)
    db.commit()
    db.refresh(new_puzzle)
    
    logger.info(f"Successfully created and saved puzzle for {puzzle_date}")
    return new_puzzle
