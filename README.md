# Her Health Journey — Frontend Web Application

A women's health tracking platform built with React, TypeScript, Tailwind CSS, and React Router as a dedicated frontend client for an external **Java Spring Boot REST API**.

## Features & Pages

1. **Home (`/`)** — Brand introduction, purpose, six core module descriptions, privacy & ownership guarantee, and authentication actions.
2. **Login (`/login`)** — Email and password sign-in with validation, password visibility toggle, API error feedback, and an offline UI preview option when the Spring Boot server is not yet connected.
3. **Registration (`/register`)** — Full name, email, password strength indicator, confirm password matching validation, and privacy consent.
4. **Dashboard (`/dashboard`)** — Cycle overview, recent PCOS symptoms, mood & wellness summary, nutrition summary, water intake tracker, journal history, and cycle length chart backed by `/api/dashboard`.
5. **Period Tracker (`/period-tracker`)** — Interactive monthly calendar, period start/end date logging, edit and delete operations, cycle history table, average cycle length, and approximate phase/next-period estimates.
6. **PCOS Symptom Tracker (`/pcos-tracker`)** — Symptom selection, 1–5 severity scale, pain level (0–10), energy level (1–5), personal observations, and longitudinal trend chart.
7. **Mood & Wellness (`/wellness`)** — Mood state selector, sleep duration slider, sleep quality rating, stress index (1–10), daily notes, and weekly rhythm chart.
8. **Nutrition & Diet (`/nutrition`)** — Daily calorie & macronutrient progress, Breakfast/Lunch/Dinner/Snacks food diary, item logging modal, and meal history.
9. **Water Tracker (`/water`)** — Editable daily water target, quick-add intake controls, SVG progress ring, hydration reminder preference toggle, and historical records.
10. **Health Journal (`/journal`)** — Create, edit, and delete entries, live keyword search, category filtering, and date-ordered history.
11. **Profile (`/profile`)** — Personal details, notification preferences, JSON profile export, account deletion confirmation, and logout.

## Architecture & Spring Boot API Contract

This application does **not** include a Node.js business backend, Firebase, or `localStorage` database persistence. Authentication tokens are held strictly in memory (`AuthContext` + `src/api/client.ts`).

Configure the backend base URL via `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Expected REST endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/periods`, `POST /api/periods`, `PUT /api/periods/{id}`, `DELETE /api/periods/{id}`
- `GET /api/symptoms`, `POST /api/symptoms`, `DELETE /api/symptoms/{id}`
- `GET /api/wellness`, `POST /api/wellness`
- `GET /api/nutrition?date=YYYY-MM-DD`, `POST /api/nutrition`, `DELETE /api/nutrition/{id}`
- `GET /api/water?date=YYYY-MM-DD`, `POST /api/water`, `PUT /api/water`
- `GET /api/journal`, `POST /api/journal`, `PUT /api/journal/{id}`, `DELETE /api/journal/{id}`
- `GET /api/profile`, `PUT /api/profile`, `DELETE /api/profile`

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your Spring Boot server URL
npm run dev
```

## Unit Tests

```bash
npx --yes tsx --test src/utils/validation.test.ts src/utils/healthCalculations.test.ts
```

## Build & Production Deployment

```bash
npm run lint
npm run build
```

### Hosting on Vercel

This repository includes `/vercel.json` preconfigured for Vite (`dist` output directory) and React Router SPA fallback rewrites so direct links and page refreshes on `/login`, `/dashboard`, `/period-tracker`, `/journal`, `/profile`, etc. never return a 404.

1. **Import Repository in Vercel**: Connect your Git repository or run `vercel --prod` with the root directory.
   - Framework Preset: `Vite` (auto-detected from `vercel.json`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Configure `VITE_API_BASE_URL` in Vercel**:
   - Open **Project Settings -> Environment Variables**.
   - Add `VITE_API_BASE_URL` pointing to your deployed Java Spring Boot API **using `https://`** (e.g., `https://api.herhealthjourney.com`), without a trailing slash.
   - Because Vite injects `VITE_*` variables at build time, **trigger a Redeploy** whenever you add or change `VITE_API_BASE_URL`.
3. **Configure Spring Boot CORS for Vercel**:
   - Because `src/api/client.ts` sends `Authorization: Bearer <token>` and `credentials: 'include'`, Spring Boot must explicitly allow your Vercel origin(s) instead of `*`:

   ```java
   registry.addMapping("/api/**")
       .allowedOriginPatterns("https://*.vercel.app", "https://your-custom-domain.com")
       .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
       .allowedHeaders("Authorization", "Content-Type", "Accept")
       .allowCredentials(true);
   ```

