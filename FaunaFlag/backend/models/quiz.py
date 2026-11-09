from datetime import datetime

from pydantic import BaseModel, Field

from models.film import Flag


class QuizAnswer(BaseModel):
    film_id: str
    flag: Flag


class QuizSubmit(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1)


class SubmitResponse(BaseModel):
    id: str


class FlagSplit(BaseModel):
    red: float = 0
    amber: float = 0
    green: float = 0


class BreakdownRow(BaseModel):
    film_id: str
    title: str
    year: int
    poster_url: str = ""
    your_flag: Flag
    official_flag: Flag
    community: FlagSplit
    community_total: int


class QuizResult(BaseModel):
    id: str
    created_at: datetime
    total: int
    counts: FlagSplit
    percentages: FlagSplit
    agreement_pct: float
    strictness: float
    strictness_percentile: float
    tolerance_label: str
    community_avg: FlagSplit
    community_avg_agreement: float
    community_match_pct: float
    submissions_total: int
    breakdown: list[BreakdownRow]


class CommunityStats(BaseModel):
    submissions_total: int
    films_total: int
    avg_percentages: FlagSplit
    avg_agreement: float
    official_split: FlagSplit
