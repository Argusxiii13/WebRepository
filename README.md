# Web Repository (React / Next.js)

Frontend app for login, geolocation dashboard, IP lookup, history, bulk delete, and map pin.

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

### 4) Start Frontend Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Full App Run (API + Web)

You must run both repositories at the same time:

1. In `ApiRepository`:

	```bash
	php artisan serve
	```

2. In `webrepository`:

	```bash
	npm run dev
	```

3. Open the UI:

	```text
	http://localhost:3000
	```

## Login Credentials

- Email: `exam.user@example.com`
- Password: `Password123!`

## Important Notes

- `http://localhost:8000/api/login` is an API endpoint (POST), not a page URL.
- The login page is on the web app URL: `http://localhost:3000`.
- If port `3000` is busy, Next.js may use `3001`. Use the exact URL shown in terminal output.

## Common Troubleshooting

- If login fails with `401`, run in API repo:

  ```bash
  php artisan migrate --seed
  ```

- If API calls fail, ensure Laravel is running on port `8000`.
- If Next.js fails with a lock error, stop all `next dev` processes and restart.
