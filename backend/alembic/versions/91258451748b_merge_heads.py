"""merge heads

Revision ID: 91258451748b
Revises: 001, 002_add_duty_category
Create Date: 2025-07-16 06:41:49.867961

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '91258451748b'
down_revision: Union[str, None] = ('001', '002_add_duty_category')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
