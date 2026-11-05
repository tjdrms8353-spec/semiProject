from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserProfile(Base):
    """Confirmed ERD names; storage types await shared TiDB DDL review."""
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    body_shape: Mapped[str | None] = mapped_column(String(80))
    preferred_fit: Mapped[str | None] = mapped_column(String(80))
    preferred_style: Mapped[str | None] = mapped_column(String(80))
    personal_color: Mapped[str | None] = mapped_column(String(80))
    preferred_colors: Mapped[list[str] | None] = mapped_column(JSON(none_as_null=True))
