FaunaFlag — SPEC
Bechdel-style test for animal cruelty in film. Anonymous, no user accounts.

Flows
/ landing: thesis, the 3 flag definitions, live community index (GET /api/stats).
/quiz: pick a mode (Quick 10 / Feature 20 / Full archive). Each step shows one film (title, year, director, species, animal-treatment dossier). The user rates it Red, Amber or Green (also keys 1/2/3 or R/A/G), or skips, goes back, or finishes early. Submitting goes to POST /api/quiz/submit and then to /results/:id. The last result id is kept in localStorage.
/results/:id: % red/amber/green (donut, with "% rated safe" = green), agreement with the curated flags, agreement with the community majority, strictness index (red=100, amber=50, green=0, averaged), strictness percentile among all submissions, tolerance label, you-vs-community-average bars, and a per-film debrief (your flag, curated flag, community split).
/library: curated archive. Search (title/director/species), filter by flag, sort, expandable dossier, community vote bar.
/admin: PIN-gated (httpOnly cookie ff_admin). Has Films and Suggestions tabs. Films tab: CRUD, "Restore defaults" (upserts the seed films by title and never deletes anything), lock. Suggestions tab: the pending queue. "Review & approve" opens a prefilled film form; saving creates the film and marks the suggestion approved. Reject marks it rejected (soft, never deleted).
Library has a "Suggest a film" dialog (public): title, year, director, animals, description (min 10 chars), suggested flag, optional name.
Results page has a "Share my verdict" dialog: a 1200x630 PNG card drawn client-side on a canvas (tolerance label, R/A/G bars with community markers, donut, % safe, agreement, percentile). Options: download, Web Share (if supported), X intent, Facebook sharer, copy link to /results/:id.
Data (Mongo)
films {id, title, year, director, genre, species[], description, flag: red|amber|green, poster_url, poster_checked}. Auto-seeded with 46 films on startup if empty (backend/lib/seed_data.py).
Posters: backend/lib/posters.py looks them up through Wikipedia's page-image API (no key). On startup, a background backfill handles every film without poster_checked. Create, update and approve look up a poster automatically when poster_url is empty. Admin GET /posters/lookup?title&year backs the "Find poster" button; admins can also paste any image URL. The frontend Poster component falls back to a typographic card when there's no image or it fails to load. Known gap: Finding Nemo's Wikipedia image is a title logo, not a poster.
submissions {id, created_at, answers[{film_id, flag}], total, counts, percentages, agreement_pct, strictness}
votes {submission_id, film_id, flag}. Used for community splits.
suggestions {id, title, year, director, species[], description, suggested_flag, submitter_name, status: pending|approved|rejected, created_at, film_id}
API (all /api)
GET /films?q=&flag= · GET /films/community · GET /films/{id} · POST/PUT/DELETE /films (admin) POST /admin/login {pin} · GET /admin/me · POST /admin/logout · POST /admin/reseed (admin) GET /quiz/films?count= · POST /quiz/submit {answers} · GET /quiz/results/{id} · GET /stats POST /suggestions (public) · GET /suggestions?status= (admin) · POST /suggestions/{id}/approve {FilmCreate} (admin) · POST /suggestions/{id}/reject (admin)