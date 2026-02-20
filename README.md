# Web Repository (React / Next.js)

Frontend app for login, geolocation dashboard, IP lookup, history, bulk delete, and map pin.

## Repository Links

- Web Repo: https://github.com/Argusxiii13/WebRepository.git
- API Repo: https://github.com/Argusxiii13/ApiRepository.git

## Tech Stack

- Node.js 20+
- npm 10+
- Next.js 16

## Fresh Machine Setup (No Guesswork)

### 1) Prerequisites

Install and verify:

- Node.js 20+
- npm 10+

### 2) Install Dependencies

From this folder (`webrepository`):

```bash
npm install
```

### 3) Optional Environment File

By default, the app already targets:

```text
http://localhost:8000/api
```

If needed, create `.env.local` and set:

```dotenv
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```

Backend/API setup is documented in `../ApiRepository/README.md`.

### 4) Start Frontend Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Backend Requirement

- Use **XAMPP first** (default path for this project): start Apache and MySQL.
- Run the Laravel API from `ApiRepository` on `http://localhost:8000`.
- Create the backend database in phpMyAdmin: `http://localhost/phpmyadmin/`.
- For full backend setup (database, migration, seed credentials), see `../ApiRepository/README.md`.

## Important Notes

- `http://localhost:8000/api/login` is an API endpoint (POST), not a page URL.
- The login page is on the web app URL: `http://localhost:3000`.
- If port `3000` is busy, Next.js may use `3001`. Use the exact URL shown in terminal output.

## Common Troubleshooting

- If API calls fail, ensure Laravel is running on port `8000`.
- If Next.js fails with a lock error, stop all `next dev` processes and restart.
