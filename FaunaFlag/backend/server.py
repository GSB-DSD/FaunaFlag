import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from lib.db import client, ensure_indexes  # noqa: E402
from lib.posters import backfill_posters  # noqa: E402
from lib.seed_data import seed_if_empty  # noqa: E402
from routers import films, quiz, suggestions  # noqa: E402

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    try:
        await seed_if_empty()
    except Exception as exc:  # never block boot on seeding
        logger.error("seed_if_empty failed: %s", exc)
    app.state.poster_task = asyncio.create_task(backfill_posters())  # background: network lookups must not block boot
    yield
    app.state.poster_task.cancel()
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "FaunaFlag API"}


api_router.include_router(films.router)
api_router.include_router(quiz.router)
api_router.include_router(suggestions.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app.include_router(api_router)
