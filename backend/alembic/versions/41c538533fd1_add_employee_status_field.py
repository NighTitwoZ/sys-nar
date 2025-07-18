"""add employee status field

Revision ID: 41c538533fd1
Revises: 91258451748b
Create Date: 2025-07-17 21:01:44.606583

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41c538533fd1'
down_revision: Union[str, None] = '91258451748b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
