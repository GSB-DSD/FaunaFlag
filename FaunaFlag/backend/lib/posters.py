"""Poster lookup via Wikipedia's page-image API (no key needed)."""
import asyncio
import logging
import re

import httpx

from lib.db import db

logger = logging.getLogger(__name__)

API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "FaunaFlag/1.0 (film poster lookup; https://faunaflag.app)"}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


async def find_poster(title: str, year: int | None = None) -> str:
    """Return a poster image URL for the film, or "" if none is found."""
    queries = [f"{title} {year} film" if year else f"{title} film", f"{title} film"]
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10) as client:
            for q in queries:
                r = await client.get(
                    API,
                    params=dict(
                        action="query", format="json", generator="search", gsrsearch=q, gsrlimit=3,
                        prop="pageimages", piprop="thumbnail", pithumbsize=500, pilicense="any",
                    ),
                )
                if r.status_code != 200:
                    continue
                pages = sorted(r.json().get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
                want = _norm(title)
                for p in pages:
                    src = p.get("thumbnail", {}).get("source")
                    # page title must contain the film title, e.g. "Babe (film)" for "Babe"
                    if src and want and want in _norm(p.get("title", "")):
                        return src.split("?")[0]
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("poster lookup failed for %s: %s", title, exc)
    return ""


async def backfill_posters() -> None:
    """Look up posters for films never checked before. Runs once per film."""
    async for f in db.films.find({"poster_checked": {"$ne": True}}, {"_id": 0, "id": 1, "title": 1, "year": 1, "poster_url": 1}):
        update: dict = {"poster_checked": True}
        if not f.get("poster_url"):
            update["poster_url"] = await find_poster(f["title"], f.get("year"))
        await db.films.update_one({"id": f["id"]}, {"$set": update})
        await asyncio.sleep(0.2)  # be polite to Wikipedia
