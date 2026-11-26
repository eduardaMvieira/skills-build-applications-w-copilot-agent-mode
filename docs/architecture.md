# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep page rendering, forms, and loading, empty, and error states in React. Use the shared API client with relative `/api` paths; keep business and persistence logic out of the frontend.
- Logic tier decision: Keep Express handlers thin and put behavior in explicit service functions. Validate request fields and IDs, check referenced records, and return deliberate 4xx responses for invalid or missing resources. Preserve the response shapes in the API contract.
- Data tier decision: Enforce required fields, references, and applicable value constraints in Mongoose schemas. Keep seed data idempotent with upserts; do not clear unrelated records, and reconcile a demo user's previous team membership when moving that fixture.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and ensure the user and team exist. Store references as `user` and `team`, calculate points from minutes (one point per minute, consistent with the fixtures), and set `occurredAt`.
- Team management approach: Reject a missing team name with `400`; create and list teams with their submitted name, mascot, and member references.
- Leaderboard approach: Sum activity points by team, sort highest total first, and return `teamName`, `totalPoints`, and a 1-based rank.
- Workout suggestions approach: Find the user by email and use their fitness goal and recent activity to prioritize matching workouts. Include a human-readable reason with each suggestion and return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — 4 failed, 1 passed. Failures indicate missing required-field validation in the User, Team, Activity, and Workout schemas; the seed/idempotency test passed.
- API command: `npm run test:api --prefix octofit-tracker/backend` — 4 failed. Failures indicate activity/team creation is unimplemented (501 instead of deliberate 4xx/created responses), leaderboard aggregation is missing, and workout suggestions lack an explanatory reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — 15 failed. Failures cover API-backed page rendering and workout suggestions, plus loading, empty, and accessible API error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — passed; TypeScript type-check completed.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — passed; TypeScript check and Vite production build completed.

Latest run: 2026-11-26. MongoDB responded successfully to `mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'` before the API tests; those tests use an isolated `mongodb-memory-server` instance.
