import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.admin import COOKIE_NAME, admin_token, is_admin, pin_ok, require_admin
from lib.db import db
from lib.posters import backfill_posters, find_poster
from lib.seed_data import reseed_films
from models.film import (
    AdminLogin,
    AdminStatus,
    Film,
    FilmCommunity,
    FilmCreate,
    Flag,
    PosterLookup,
    ReseedResult,
)

router = APIRouter()


@router.get("/films", response_model=list[Film])
async def list_films(q: Optional[str] = None, flag: Optional[Flag] = None):
    query: dict = {}
    if flag:
        query["flag"] = flag
    if q:
        query["title"] = {"$regex": re.escape(q), "$options": "i"}
    docs = await db.films.find(query, {"_id": 0}).sort("title", 1).to_list(2000)
    return [Film(**d) for d in docs]


@router.get("/films/community", response_model=list[FilmCommunity])
async def films_community():
    pipeline = [{"$group": {"_id": {"film_id": "$film_id", "flag": "$flag"}, "n": {"$sum": 1}}}]
    out: dict[str, FilmCommunity] = {}
    async for row in db.votes.aggregate(pipeline):
        fid = row["_id"]["film_id"]
        c = out.setdefault(fid, FilmCommunity(film_id=fid))
        setattr(c, row["_id"]["flag"], row["n"])
        c.total += row["n"]
    return list(out.values())


@router.get("/films/{id}", response_model=Film)
async def get_film(id: str):
    doc = await db.films.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Film not found")
    return Film(**doc)


@router.post("/films", response_model=Film, dependencies=[Depends(require_admin)])
async def create_film(body: FilmCreate):
    film = Film(**body.model_dump())
    if not film.poster_url:
        film.poster_url = await find_poster(film.title, film.year)
    await db.films.insert_one({**film.model_dump(), "poster_checked": True})
    return film


@router.put("/films/{id}", response_model=Film, dependencies=[Depends(require_admin)])
async def update_film(id: str, body: FilmCreate):
    if not await db.films.find_one({"id": id}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Film not found")
    data = body.model_dump()
    if not data["poster_url"]:
        data["poster_url"] = await find_poster(data["title"], data["year"])
    await db.films.update_one({"id": id}, {"$set": {**data, "poster_checked": True}})
    return Film(id=id, **data)


@router.get("/posters/lookup", response_model=PosterLookup, dependencies=[Depends(require_admin)])
async def poster_lookup(title: str, year: int | None = None):
    return PosterLookup(poster_url=await find_poster(title, year))


@router.delete("/films/{id}", dependencies=[Depends(require_admin)])
async def delete_film(id: str):
    res = await db.films.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Film not found")
    await db.votes.delete_many({"film_id": id})
    return {"ok": True}


@router.post("/admin/login", response_model=AdminStatus)
async def admin_login(body: AdminLogin, response: Response):
    if not pin_ok(body.pin):
        raise HTTPException(status_code=401, detail="Incorrect PIN")
    response.set_cookie(
        COOKIE_NAME, admin_token(), httponly=True, secure=True, samesite="lax", max_age=60 * 60 * 12
    )
    return AdminStatus(authenticated=True)


@router.get("/admin/me", response_model=AdminStatus)
async def admin_me(request: Request):
    return AdminStatus(authenticated=is_admin(request))


@router.post("/admin/logout", response_model=AdminStatus)
async def admin_logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return AdminStatus(authenticated=False)


@router.post("/admin/reseed", response_model=ReseedResult, dependencies=[Depends(require_admin)])
async def admin_reseed():
    total = await reseed_films()
    await backfill_posters()
    return ReseedResult(films_total=total)
