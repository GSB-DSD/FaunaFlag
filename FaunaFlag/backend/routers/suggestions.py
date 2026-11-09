from datetime import timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from lib.admin import require_admin
from lib.db import db
from lib.posters import find_poster
from models.film import Film, FilmCreate
from models.suggestion import Suggestion, SuggestionCreate, SuggestionStatus

router = APIRouter()


def _to_model(doc: dict) -> Suggestion:
    if doc["created_at"].tzinfo is None:
        doc["created_at"] = doc["created_at"].replace(tzinfo=timezone.utc)
    return Suggestion(**doc)


@router.post("/suggestions", response_model=Suggestion)
async def create_suggestion(body: SuggestionCreate):
    data = body.model_dump()
    data["species"] = [s.strip() for s in data["species"] if s.strip()]
    s = Suggestion(**data)
    await db.suggestions.insert_one(s.model_dump())
    return s


@router.get("/suggestions", response_model=list[Suggestion], dependencies=[Depends(require_admin)])
async def list_suggestions(status: Optional[SuggestionStatus] = "pending"):
    query = {"status": status} if status else {}
    docs = await db.suggestions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_to_model(d) for d in docs]


async def _pending(id: str) -> dict:
    doc = await db.suggestions.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if doc["status"] != "pending":
        raise HTTPException(status_code=409, detail="Suggestion already reviewed")
    return doc


@router.post("/suggestions/{id}/approve", response_model=Film, dependencies=[Depends(require_admin)])
async def approve_suggestion(id: str, body: FilmCreate):
    await _pending(id)
    film = Film(**body.model_dump())
    if not film.poster_url:
        film.poster_url = await find_poster(film.title, film.year)
    await db.films.insert_one({**film.model_dump(), "poster_checked": True})
    await db.suggestions.update_one({"id": id}, {"$set": {"status": "approved", "film_id": film.id}})
    return film


@router.post("/suggestions/{id}/reject", response_model=Suggestion, dependencies=[Depends(require_admin)])
async def reject_suggestion(id: str):
    doc = await _pending(id)
    await db.suggestions.update_one({"id": id}, {"$set": {"status": "rejected"}})
    doc["status"] = "rejected"
    return _to_model(doc)
