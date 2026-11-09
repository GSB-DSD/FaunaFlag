import uuid
from typing import Literal

from pydantic import BaseModel, Field

Flag = Literal["red", "amber", "green"]


class FilmBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    year: int = Field(ge=1880, le=2100)
    director: str = ""
    genre: str = ""
    species: list[str] = Field(default_factory=list)
    description: str = Field(min_length=1)
    flag: Flag
    poster_url: str = Field(default="", max_length=1000)


class PosterLookup(BaseModel):
    poster_url: str

class FilmCreate(FilmBase):
    pass


class Film(FilmBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class FilmCommunity(BaseModel):
    film_id: str
    red: int = 0
    amber: int = 0
    green: int = 0
    total: int = 0


class AdminLogin(BaseModel):
    pin: str


class AdminStatus(BaseModel):
    authenticated: bool


class ReseedResult(BaseModel):
    films_total: int
