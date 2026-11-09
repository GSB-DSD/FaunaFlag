import random
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.film import Film
from models.quiz import (
    BreakdownRow,
    CommunityStats,
    FlagSplit,
    QuizResult,
    QuizSubmit,
    SubmitResponse,
)

router = APIRouter()

FLAGS = ("red", "amber", "green")


def _pct(n: float, total: float) -> float:
    return round(n * 100 / total, 1) if total else 0.0


def _strictness(counts: dict[str, int], total: int) -> float:
    return round((counts["red"] * 100 + counts["amber"] * 50) / total, 1) if total else 0.0


def _tolerance_label(strictness: float) -> str:
    if strictness >= 70:
        return "Strict Animal Guardian"
    if strictness >= 45:
        return "Conscientious Viewer"
    if strictness >= 20:
        return "Pragmatic Cinephile"
    return "Lenient Cinephile"


@router.get("/quiz/films", response_model=list[Film])
async def quiz_films(count: int = Query(10, ge=1, le=500)):
    docs = await db.films.find({}, {"_id": 0}).to_list(2000)
    random.shuffle(docs)
    return [Film(**d) for d in docs[:count]]


@router.post("/quiz/submit", response_model=SubmitResponse)
async def submit_quiz(body: QuizSubmit):
    # de-duplicate by film, keep last answer
    answers = {a.film_id: a.flag for a in body.answers}
    films = await db.films.find({"id": {"$in": list(answers)}}, {"_id": 0, "id": 1, "flag": 1}).to_list(2000)
    official = {f["id"]: f["flag"] for f in films}
    answers = {fid: fl for fid, fl in answers.items() if fid in official}
    if not answers:
        raise HTTPException(status_code=400, detail="No valid film answers")

    total = len(answers)
    counts = {f: sum(1 for v in answers.values() if v == f) for f in FLAGS}
    matches = sum(1 for fid, fl in answers.items() if official[fid] == fl)
    sid = str(uuid.uuid4())
    await db.submissions.insert_one(
        {
            "id": sid,
            "created_at": datetime.now(timezone.utc),
            "answers": [{"film_id": k, "flag": v} for k, v in answers.items()],
            "total": total,
            "counts": counts,
            "percentages": {f: _pct(counts[f], total) for f in FLAGS},
            "agreement_pct": _pct(matches, total),
            "strictness": _strictness(counts, total),
        }
    )
    await db.votes.insert_many([{"submission_id": sid, "film_id": k, "flag": v} for k, v in answers.items()])
    return SubmitResponse(id=sid)


async def _community_avg() -> tuple[int, FlagSplit, float]:
    pipeline = [
        {
            "$group": {
                "_id": None,
                "n": {"$sum": 1},
                "red": {"$avg": "$percentages.red"},
                "amber": {"$avg": "$percentages.amber"},
                "green": {"$avg": "$percentages.green"},
                "agree": {"$avg": "$agreement_pct"},
            }
        }
    ]
    rows = await db.submissions.aggregate(pipeline).to_list(1)
    if not rows:
        return 0, FlagSplit(), 0.0
    r = rows[0]
    return (
        r["n"],
        FlagSplit(red=round(r["red"], 1), amber=round(r["amber"], 1), green=round(r["green"], 1)),
        round(r["agree"], 1),
    )


@router.get("/quiz/results/{id}", response_model=QuizResult)
async def get_result(id: str):
    sub = await db.submissions.find_one({"id": id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Result not found")

    film_ids = [a["film_id"] for a in sub["answers"]]
    films = {f["id"]: f for f in await db.films.find({"id": {"$in": film_ids}}, {"_id": 0}).to_list(2000)}

    community: dict[str, dict[str, int]] = {}
    pipeline = [
        {"$match": {"film_id": {"$in": film_ids}}},
        {"$group": {"_id": {"film_id": "$film_id", "flag": "$flag"}, "n": {"$sum": 1}}},
    ]
    async for row in db.votes.aggregate(pipeline):
        community.setdefault(row["_id"]["film_id"], {f: 0 for f in FLAGS})[row["_id"]["flag"]] = row["n"]

    breakdown: list[BreakdownRow] = []
    majority_matches = 0
    for a in sub["answers"]:
        f = films.get(a["film_id"])
        if not f:
            continue  # film deleted since submission
        c = community.get(a["film_id"], {fl: 0 for fl in FLAGS})
        ctotal = sum(c.values())
        if ctotal and c[a["flag"]] == max(c.values()):
            majority_matches += 1
        breakdown.append(
            BreakdownRow(
                film_id=f["id"],
                title=f["title"],
                year=f["year"],
                poster_url=f.get("poster_url", ""),
                your_flag=a["flag"],
                official_flag=f["flag"],
                community=FlagSplit(**{fl: _pct(c[fl], ctotal) for fl in FLAGS}),
                community_total=ctotal,
            )
        )

    n_subs, avg, avg_agree = await _community_avg()
    strictness = sub["strictness"]
    lower = await db.submissions.count_documents({"strictness": {"$lt": strictness}})
    equal = await db.submissions.count_documents({"strictness": strictness})
    percentile = round((lower + 0.5 * equal) * 100 / n_subs, 1) if n_subs else 0.0

    created = sub["created_at"]
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    return QuizResult(
        id=sub["id"],
        created_at=created,
        total=sub["total"],
        counts=FlagSplit(**sub["counts"]),
        percentages=FlagSplit(**sub["percentages"]),
        agreement_pct=sub["agreement_pct"],
        strictness=strictness,
        strictness_percentile=percentile,
        tolerance_label=_tolerance_label(strictness),
        community_avg=avg,
        community_avg_agreement=avg_agree,
        community_match_pct=_pct(majority_matches, len(breakdown)),
        submissions_total=n_subs,
        breakdown=breakdown,
    )


@router.get("/stats", response_model=CommunityStats)
async def stats():
    n_subs, avg, avg_agree = await _community_avg()
    split = {f: await db.films.count_documents({"flag": f}) for f in FLAGS}
    films_total = sum(split.values())
    return CommunityStats(
        submissions_total=n_subs,
        films_total=films_total,
        avg_percentages=avg,
        avg_agreement=avg_agree,
        official_split=FlagSplit(**{f: _pct(split[f], films_total) for f in FLAGS}),
    )
