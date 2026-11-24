# HER HEALTH JOURNEY — Dual-Platform Wellness System

> **KNOW YOUR BODY. OWN YOUR JOURNEY.**  
> A production-grade, dual-platform women's period, PCOS, and holistic wellness tracking system with an Emerald Green + Champagne Gold luxury visual identity.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production%20Ready-brightgreen)](https://vercel.com)
[![Java 21](https://img.shields.io/badge/Backend-Java%2021%20%7C%20Spring%20Boot-orange)](backend/)
[![Android Native](https://img.shields.io/badge/Android-Native%20Java-green)](android/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20Flyway-blue)](database/)

---

## 🏛️ Project Architecture

```
/her-health-tracker
  ├── /src                # React 19 + TypeScript + Vite + Tailwind (Vercel Frontend)
  ├── /android            # Native Java Android SDK app (XML, Material Components)
  ├── /backend            # Java 21 + Spring Boot 3.3.4 + Spring Security + REST APIs
  ├── /database           # Relational MySQL DDL schemas & Flyway migrations
  ├── /docs               # Complete architecture, API specs & ER diagrams
  ├── vercel.json         # Vercel zero-error production SPA routing
  └── package.json        # Frontend scripts & dependencies
```

---

## 🌿 Official Emerald & Champagne Gold Brand Identity

| Token | Hex | Role |
|---|---|---|
| **Brand Emerald** | `#103C32` | Primary brand color, headers, app bars, key buttons |
| **Emerald 950** | `#092820` | Dark cinematic background, high-contrast containers |
| **Emerald Jade** | `#27836A` | Active indicators, secondary accents |
| **Champagne Gold** | `#C5A66B` | Brand emblem monogram, active navigation, luxury badges |
| **Gold Light** | `#E4D2A5` | Light sweep animations, focal highlights |
| **Cream Canvas** | `#F8F5EB` | Warm, accessible light-theme background |

### 6 Module Accent Palette
- 🌸 **Period Tracker**: `#E58B91` (Blush Rose)
- 💜 **PCOS Symptom Tracker**: `#B49AD8` (Lavender Orchid)
- 🌿 **Mood & Wellness**: `#A8BCA4` (Sage Harmony)
- 🍞 **Nutrition & Diet**: `#D8AA65` (Warm Amber)
- 💧 **Water Tracker**: `#70B8C8` (Serene Blue)
- 📖 **Health Journal**: `#D4B98A` (Champagne Sand)

---

## 🎬 6-Scene Cinematic Brand Opening

Both Web and Android feature a synchronized, high-elegance opening:
1. **Scene 1**: Deep emerald (`#092820`) background fades in.
2. **Scene 2**: Champagne-gold light sweep moves across the viewport.
3. **Scene 3**: Architectural "H" brand monogram appears.
4. **Scene 4**: Reveal `HER HEALTH JOURNEY` in bold premium typography.
5. **Scene 5**: Display `KNOW YOUR BODY. OWN YOUR JOURNEY.`
6. **Scene 6**: Smooth transition into the real application.

---

## 📱 Native Android Mobile Application (`/android`)

- **Language**: Java 17/21
- **Framework**: Native Android SDK, AndroidX, Material Design Components
- **Architecture**: MVVM with Repository pattern, Room local draft persistence
- **Features**:
  - `SplashActivity`: Native 6-scene `AnimatorSet` with Skip Intro & `SharedPreferences`
  - `MainActivity`: Emerald app bar & bottom navigation with Champagne gold active states
  - `DashboardFragment`: Holistic card overview of all 6 health domains
  - `PeriodFragment`, `SymptomsFragment`, `WaterFragment`, `WellnessFragment`
  - Secure Keystore token storage (`SecureTokenManager`)

---

## 💻 Web Application (`/src`) & Vercel Deployment

Built with React 19, TypeScript, and Tailwind CSS.

### Deploying to Vercel (1-Click Ready):
1. Import repository `satboy-12/her-health-tracker` in Vercel.
2. Framework Preset: **Vite** (auto-detected).
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment variable: `VITE_API_BASE_URL` (points to Spring Boot API backend).

---

## ☕ Spring Boot REST API Backend (`/backend`)

- **Runtime**: Java 21, Spring Boot 3.3.4
- **Security**: Spring Security 6 with JWT stateless authentication & BCrypt
- **ORM & DB**: Spring Data JPA, Hibernate, MySQL with Flyway versioning
- **Endpoints**:
  - `POST /api/auth/register`, `POST /api/auth/login`
  - `GET /api/dashboard`
  - `GET/POST/PUT/DELETE /api/periods`
  - `GET/POST/DELETE /api/symptoms`
  - `GET/POST /api/wellness`
  - `GET/POST/DELETE /api/nutrition`
  - `GET/POST/PUT /api/water`
  - `GET/POST/PUT/DELETE /api/journal`

---

## 🧪 Testing & Quality Assurance

- **Unit Tests**: 10/10 passing (`npm run test`)
- **TypeScript**: 0 errors (`npm run lint` / `tsc --noEmit`)
- **Vite Build**: Compiled production bundle cleanly (`npm run build`)
