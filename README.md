# Event Booking Platform - EventHub

EventHub is a responsive event discovery and booking application built with React, Express.js, and SQLite. Visitors can explore events; attendees can register and cancel bookings; organizers can create and manage their events and view attendee lists. Administrators have access to administrative management features.

The application was designed in Figma and implements a database-backed REST API rather than hard-coded frontend records.

## Project links

- **GitHub repository:** 
- [View EventHub Figma Design](https://www.figma.com/design/didUgfgcNtEEhtd1hdShcb/Event-Booking-App--EventHub?node-id=846-4152&t=dKjLZAd2PpkhWIBg-1)

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19, React Router 7, Vite 8 | Components, client-side routing, development/build tooling |
| Styling | CSS and responsive media queries | Custom Figma-based desktop/mobile layouts |
| Backend | Node.js, Express 5 | REST API and business logic |
| Database | SQLite (`better-sqlite3`) | Persistent relational data |
| Authentication | bcrypt, JWT in an HttpOnly cookie | Password hashing and authenticated sessions |
| Validation/security | Zod, CORS, Helmet, rate limiting | Server-side validation and basic API protection |
| Tests | Node.js test runner, Supertest | Backend API and authorization tests |

## Prerequisites

- Node.js and npm compatible with the project's Vite and backend dependencies.
- Two terminals (one for the API, one for the frontend).
- No external database server is needed: SQLite stores its data in a local file.

## Quick start (local development)

Run all commands from the repository root unless a step tells you to change directories.

### 1. Configure and seed the backend

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set a unique, sufficiently long `JWT_SECRET`. To generate one:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the resulting string into the `JWT_SECRET` field in `backend/.env` (do not commit the file).

```powershell
npm run db:seed
npm run dev
```

The backend listens at **http://localhost:4000** by default. Keep this terminal open. To confirm that it is running, visit **http://localhost:4000/api/health**; the expected response is `{ "status": "ok" }`.

### 2. Start the frontend (in a second terminal)

From the repository root:

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173** (or the URL Vite displays). The development server proxies `/api` requests to the backend on port 4000, so **both processes must be running**.

### Environment variables

The tracked template is `backend/.env.example`:

| Variable | Default/example | Description |
| --- | --- | --- |
| `PORT` | `4000` | Express listening port |
| `JWT_SECRET` | Secure secret key is in local `.env` |
| `JWT_EXPIRES_IN_SECONDS` | `7200` | Authentication-token lifetime in seconds |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Browser origin allowed by CORS |
| `DB_PATH` | `./data/events.db` | Local SQLite database file (relative to `backend/` when started there) |
| `NODE_ENV` | `development` | Runtime mode |

The SQLite schema is applied when the backend opens its database. `npm run db:seed` creates initial records without requiring a separate database server. Seeding can be rerun: users, venues, and categories are inserted if missing, and sample events are added only when there are no events yet.

## Demo accounts (seed data only)

Run `npm run db:seed` before using these accounts. Their **shared demo password is `Password123!`**.

| Role | Email | Intended use |
| --- | --- | --- |
| Admin | `admin@example.com` | Administrative access |
| Organizer | `organizer@example.com` | Create and manage own events |
| Organizer | `organizer2@example.com` | Demonstrate ownership restrictions |
| Attendee | `attendee@example.com` | Register for events and manage bookings |
| Attendee | `attendee2@example.com` | Demonstrate multiple attendees and event capacity |

These credentials are deliberately public **test-data credentials**, not production accounts. Never reuse this password or expose actual secrets in the repository.

## User roles and key features

| Feature | Guest | Attendee | Organizer | Admin |
| --- | :---: | :---: | :---: | :---: |
| Browse/search/filter events and view event details | Yes | Yes | Yes | Yes |
| Register and cancel own event bookings | No | Yes | No | No |
| View own bookings | No | Yes | No | No |
| Create events | No | No | Yes | Yes |
| Edit/delete events | No | No | Own only | Yes |
| View event attendee lists | No | No | Own only | Yes |
| Create venues/categories | No | No | Yes | Yes |
| Edit/delete venues/categories | No | No | No | Yes |

The frontend hides or redirects users from pages that do not match their role; **the backend independently enforces authentication, roles, and event ownership**. Sensitive operations are never secured by frontend checks alone. Event registration is rejected if the event is full, and deletion flows prompt for confirmation in the interface.

The interface has custom desktop and mobile layouts matching the project's Figma designs. It includes loading, empty, error, and validation states for relevant screens.

## Database design

Defined in [`backend/src/db/schema.sql`](backend/src/db/schema.sql), with seed data in [`backend/src/db/seed.js`](backend/src/db/seed.js):

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `users` | Account name, unique email, bcrypt password hash, role | One user can organize many events and make many registrations |
| `venues` | Event venue, address, city, capacity | One venue can host many events |
| `categories` | Event categories | One category can classify many events |
| `events` | Title, description, date, capacity, organizer | References `users`, `venues`, and `categories` |
| `registrations` | Attendee's event booking and status | References `events` and `users`; unique `(event_id, user_id)` |

SQLite **primary keys** identify each record, **foreign keys** enforce references, and `CHECK`, `UNIQUE`, and other constraints protect data integrity. The API uses parameterized queries. Canceled registrations are retained with status `cancelled`, rather than automatically removed from the database. The application computes remaining seats from active registrations.

The initial seed includes sample organizers, attendees, venues, categories, and events. Seeded event dates are calculated relative to the time of seeding.

## Repository structure

```text
Event-Booking-Platform/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config.js
│   │   ├── schemas.js
│   │   ├── db/
│   │   │   ├── index.js
│   │   │   ├── schema.sql
│   │   │   └── seed.js
│   │   ├── middleware/
│   │   └── routes/
│   └── tests/
│       └── api.test.js
└── frontend/
    ├── public/
    │   ├── icons/
    │   └── images/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── lib/
    │   ├── pages/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── MobileFigma.css
    ├── package.json
    └── vite.config.js
```

- `backend/src/routes/`: HTTP endpoints for authentication, events, registrations, venues, and categories.
- `backend/src/middleware/`: authentication/authorization, input validation, and error handling.
- `frontend/src/api/`: shared `fetch` wrapper and API methods. Requests include credentials for the authentication cookie.
- `frontend/src/context/`: shared authentication state.
- `frontend/src/components/`: reusable navigation, event cards, route protection, and confirmation dialogs.
- `frontend/src/pages/`: event browsing/details, bookings, organizer dashboard, event forms, and authentication screens.

## REST API overview

Base path: `/api`. API operations exchange JSON except successful deletion endpoints that return HTTP `204 No Content`.

| Method | Endpoint | Purpose / access |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Create attendee/organizer account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Clear authentication cookie |
| `GET` | `/api/auth/me` | Current authenticated user |
| `GET` | `/api/events` | Public event listing; supports search, filters, and pagination |
| `GET` | `/api/events/:id` | Event details, counts and remaining seats |
| `GET` | `/api/events/mine` | Organizer's events |
| `POST` | `/api/events` | Create event (organizer/admin) |
| `PUT` | `/api/events/:id` | Update event (owner/admin) |
| `DELETE` | `/api/events/:id` | Delete event (owner/admin) |
| `GET` | `/api/events/:id/attendees` | Event attendee list (owner/admin) |
| `POST` | `/api/events/:id/register` | Register attendee |
| `DELETE` | `/api/events/:id/register` | Cancel attendee registration |
| `GET` | `/api/registrations/me` | Current attendee's registrations |
| `GET` | `/api/venues`, `/api/categories` | Public venue/category lookup |
| `POST` | `/api/venues`, `/api/categories` | Add lookup entries (organizer/admin) |
| `PUT`, `DELETE` | `/api/venues/:id`, `/api/categories/:id` | Update/delete lookup entries (admin) |

## Figma and design decisions

The implemented frontend uses custom typography, category colors, ticket-style cards, and responsive navigation.

[View EventHub Figma Design](https://www.figma.com/design/didUgfgcNtEEhtd1hdShcb/Event-Booking-App--EventHub?node-id=846-4152&t=dKjLZAd2PpkhWIBg-1)

## Team and contributions

| Team member | GitHub username | 
| --- | --- | --- |
| Tekla Gogua | **teklaGogua** | 
| Mirian Charaia | **M2I0R0O5** | 
