"""add duty_category to duty_types

Revision ID: 002_add_duty_category
Revises: cfbe4d6ac1be
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_duty_category'
down_revision: Union[str, None] = 'cfbe4d6ac1be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку duty_category в таблицу duty_types
    op.add_column('duty_types', sa.Column('duty_category', sa.String(50), nullable=True, server_default='academic'))
    
    # Удаляем старую колонку priority
    op.drop_column('duty_types', 'priority')


def downgrade() -> None:
    # Восстанавливаем колонку priority
    op.add_column('duty_types', sa.Column('priority', sa.Integer(), nullable=True, server_default='1'))
    
    # Удаляем колонку duty_category
    op.drop_column('duty_types', 'duty_category') 