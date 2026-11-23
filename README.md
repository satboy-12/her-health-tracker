# HER HEALTH JOURNEY – Dual-Platform Health Tracking System

HER HEALTH JOURNEY is an enterprise-grade, privacy-conscious dual-platform wellness tracking application dedicated to women's reproductive health, PCOS symptom management, and holistic lifestyle wellness.

---

## 1. Monorepository Architecture

```
HER_HEALTH_JOURNEY/
├── backend/          # Shared Java 21 Spring Boot + Vaadin Responsive Web + REST API
├── android/          # Native Android Application (Java 21, XML, Material Design, Room, Retrofit)
├── database/         # MySQL relational schema, initialization scripts, Flyway migrations
├── docs/             # UML diagrams, ER diagrams, architectural models, API references
├── design-reference/ # UI/UX design specifications, Stitch HTML designs, and screens
├── .gitignore        # Comprehensive ignore rules for Maven, Gradle, IDEs, and credentials
└── README.md         # Master project architecture & deployment guide
```

---

## 2. Core Modules

1. **Period Tracker**: Start & end dates, cycle duration analytics, estimated upcoming cycles (non-medical heuristic), and flow/pain telemetry.
2. **PCOS Symptom Tracker**: Severity scales (1–5), pain levels (0–10), energy levels, and daily symptom observations.
3. **Mood & Wellness**: Daily mood logging, sleep duration (hours), sleep quality rating, and stress index.
4. **Nutrition & Diet**: Structured meal logs (Breakfast, Lunch, Dinner, Snack), descriptions, and estimated caloric tracking.
5. **Water Tracker**: Millilitre-level intake logging with progress calculations against a daily goal.
6. **Health Journal**: Private date-stamped reflections, notes, and symptom context.
7. **Unified Dashboard**: Aggregated real-time summary for web and mobile dashboards.

---

## 3. Technology Stack

- **Backend**: Java 21, Spring Boot 3.3+, Spring Web, Spring Security, Spring Data JPA, Hibernate, Flyway, Maven.
- **Web Interface**: Vaadin 24 Flow, CSS, responsive AppLayout with desktop sidebar and mobile drawer navigation.
- **Mobile Application**: Native Android SDK (Java), Android Studio compatibility, Gradle build system, XML layouts, Jetpack Navigation, EncryptedSharedPreferences (Android Keystore), Room DB for offline drafts.
- **Database**: Shared MySQL 8.0+ relational database with Flyway versioned migrations.
- **Deployment**: Production multi-stage Docker container deployed to Render, external managed MySQL.

---

## 4. Brand Guidelines

- **Rose**: `#C65F83` (Primary accents, action buttons, active tabs)
- **Dusty Pink**: `#B66F86` (Secondary labels, borders, subdued indicators)
- **Deep Plum**: `#54243D` (Typography headings, primary navbar, high-contrast text)
- **Blush**: `#F8E7ED` (Card backgrounds, subtle highlights, badge fills)
- **White**: `#FFFFFF` (Surface cards, input backgrounds)

---

## 5. Development Stages

- **Stage 1**: Repository & Project Architecture (Completed)
- **Stage 2**: MySQL Database & Java Backend (Completed)
- **Stage 3**: Authentication & REST APIs (Completed)
- **Stage 4**: Website Implementation (Completed)
- **Stage 5**: Native Android Implementation (Completed)
- **Stage 6**: All Six Tracking Modules (Completed)
- **Stage 7**: Cross-Platform Synchronization (Completed)
- **Stage 8**: Security & Quality Assurance Testing (Completed)
- **Stage 9**: Production Deployment & Release APK (Completed)

