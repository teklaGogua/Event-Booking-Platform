# Event Booking Platform

React + Express + SQLite. Organizers create events, attendees register and cancel.

## Folder structure

```
event-booking-platform/
├── README.md                  <- how to run, test accounts, API list
├── .gitignore                 <- (root) node_modules, .env, data/, dist/
├── docs/
│   └── figma/                 <- Person 2: exported frames / link to Figma file
├── backend/                   <- Person 1
│   ├── package.json
│   ├── .env.example           <- copy to .env (never commit .env)
│   ├── src/
│   │   ├── server.js          <- starts the server
│   │   ├── app.js             <- middleware + route mounting
│   │   ├── config.js          <- reads environment variables
│   │   ├── errors.js          <- ApiError helpers (400/401/403/404/409)
│   │   ├── schemas.js         <- all server-side validation rules (zod)
│   │   ├── db/
│   │   │   ├── schema.sql     <- tables, PKs, FKs, 1-to-many relations
│   │   │   ├── index.js       <- opens SQLite, applies schema.sql
│   │   │   └── seed.js        <- test accounts + sample data
│   │   ├── middleware/
│   │   │   ├── auth.js        <- authenticate, optionalAuth, requireRole
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   └── routes/
│   │       ├── auth.js        <- register / login / logout / me
│   │       ├── events.js      <- event CRUD, attendees, register/cancel
│   │       ├── registrations.js
│   │       └── lookups.js     <- venues + categories
│   └── tests/
│       └── api.test.js        <- includes forbidden-action tests
└── frontend/                  <- Person 2 (React app, e.g. Vite)
    └── src/
        ├── api/               <- fetch wrappers (always credentials: 'include')
        ├── components/        <- Navbar, EventCard, ConfirmDialog, Spinner...
        ├── pages/             <- Events, EventDetails, Login, Register, MyRegistrations, OrganizerDashboard, EventForm
        ├── context/           <- AuthContext (current user + role)
        └── styles/
```

Rules of thumb: one folder per layer (routes / middleware / db); one file per entity inside `routes/`;
validation rules live only in `schemas.js`; secrets only in `.env`.

## Run the backend

```bash
cd backend
npm install
cp .env.example .env        # set JWT_SECRET to a long random string
npm run db:seed             # creates data/events.db with test data
npm run dev                 # http://localhost:4000
npm test                    # 22 tests, incl. forbidden actions
```

## Test accounts (password for all: `Password123!`)

| Role      | Email                  |
|-----------|------------------------|
| admin     | admin@example.com      |
| organizer | organizer@example.com  |
| organizer | organizer2@example.com |
| attendee  | attendee@example.com   |
| attendee  | attendee2@example.com  |

## API contract (for the frontend)

Auth uses an **httpOnly cookie** named `token`. The React app must send `credentials: 'include'`
on every request (fetch) or `withCredentials: true` (axios). The API allows the origin in `CLIENT_ORIGIN`
(default `http://localhost:5173`). Errors look like `{ "error": "message", "details": [{ "field", "message" }] }`.

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | /api/auth/register | public | `{name,email,password,role?}` role = attendee (default) or organizer |
| POST | /api/auth/login | public | `{email,password}` -> `{user}` |
| POST | /api/auth/logout | anyone | clears cookie |
| GET | /api/auth/me | logged in | current user, use on app start |
| GET | /api/events | public | `?q&category_id&venue_id&include_past&page&limit` -> `{data,page,limit,total,total_pages}` |
| GET | /api/events/:id | public | includes `registered_count, spots_left, is_full, my_registration` |
| GET | /api/events/mine | organizer, admin | own events |
| POST | /api/events | organizer, admin | `{title,description,event_date,capacity,venue_id,category_id}` |
| PUT | /api/events/:id | owner organizer, admin | partial update allowed |
| DELETE | /api/events/:id | owner organizer, admin | 204; frontend must ask for confirmation first |
| GET | /api/events/:id/attendees | owner organizer, admin | attendee list |
| POST | /api/events/:id/register | attendee | 409 if full / already registered |
| DELETE | /api/events/:id/register | attendee | cancel registration |
| GET | /api/registrations/me | attendee | my registrations |
| GET | /api/venues, /api/categories | public | dropdown data |
| POST | /api/venues, /api/categories | organizer, admin | |
| PUT/DELETE | /api/venues/:id, /api/categories/:id | admin | 409 if still used by events |

Status codes: 400 validation, 401 not logged in, 403 wrong role / not your event, 404 missing, 409 conflict.
