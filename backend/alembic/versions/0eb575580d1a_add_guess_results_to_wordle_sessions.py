"""add_guess_results_to_wordle_sessions

Revision ID: 0eb575580d1a
Revises: 44396027eac6
Create Date: 2025-11-15 00:29:15.113318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0eb575580d1a'
down_revision: Union[str, None] = '44396027eac6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add guess_results column to wordle_game_sessions table
    op.add_column('wordle_game_sessions', sa.Column('guess_results', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove guess_results column
    op.drop_column('wordle_game_sessions', 'guess_results')
