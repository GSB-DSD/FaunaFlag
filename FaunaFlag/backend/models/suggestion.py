import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

from models.film import Flag

SuggestionStatus = Literal["pending", "approved", "rejected"]


class SuggestionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    year: int = Field(ge=1880, le=2100)
    director: str = Field(default="", max_length=200)
    species: list[str] = Field(default_factory=list, max_length=20)
    description: str = Field(min_length=10, max_length=2000)
    suggested_flag: Flag
    submitter_name: str = Field(default="", max_length=80)


class Suggestion(SuggestionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: SuggestionStatus = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    film_id: str | None = None
