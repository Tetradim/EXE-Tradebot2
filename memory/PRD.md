# Trading Bot - Product Requirements Document

## Original Problem Statement
A full-stack Expo (React Native) and FastAPI trading bot application that supports:
- Multi-broker trading (Interactive Brokers, Alpaca, TD Ameritrade/Schwab, Tradier, Webull, Robinhood, TradeStation, Thinkorswim, Wealthsimple)
- Discord integration for parsing buy/sell alerts
- P&L tracking and position management
- Automated APK generation via CI/CD
- Averaging down feature based on Discord alerts
- Advanced risk management (Take Profit, Stop Loss, Trailing Stop, Auto Shutdown)
- **Windows Desktop Application** - Standalone .exe with bundled backend

## Core Requirements
1. **Multi-Broker Support** - Dynamic system to switch between 9 brokers with configurable API credentials
2. **P&L Tracking** - Real-time realized and unrealized P&L calculations
3. **Position Management** - Track open, partial, and closed positions with manual sell controls (25%, 50%, All)
4. **Discord Integration** - Parse buy/sell/average-down alerts including partial sell commands
5. **CI/CD Pipeline** - Automated testing and linting via GitHub Actions
6. **APK Build Automation** - Automated APK generation using Expo Application Services (EAS)
7. **Averaging Down** - Buy more when price drops to lower average cost based on Discord alerts
8. **Risk Management** - Take profit, stop loss, trailing stop, auto shutdown features
9. **Premium Buffer** - Skip trades if price deviates too much from alert price
10. **Windows Desktop App** - Electron-based standalone application with bundled Python backend
11. **Multi-Profile & Multi-Broker Support** - Run multiple brokerage accounts simultaneously

## What's Been Implemented

### Completed Features (December 2025)
- [x] Multi-broker system with 8 brokers
- [x] Broker configuration UI for API credentials
- [x] P&L calculations (realized/unrealized)
- [x] Position management screen with manual sell buttons
- [x] Discord alert parsing with partial sell support
- [x] CI/CD pipeline (`.github/workflows/ci.yml`)
- [x] EAS Build configuration (`frontend/eas.json`, `frontend/app.json`)
- [x] Automated APK build workflow (`.github/workflows/build-apk.yml`)
  - Triggers on push to main/master branches
  - Manual trigger with profile selection (development/preview/production)

### Completed Features (March 2026)
- [x] **Averaging Down Feature**
- [x] **Take Profit & Stop Loss Feature**
- [x] **Trailing Stop Feature**
- [x] **Auto Shutdown Feature**
- [x] **Premium Buffer Feature**
- [x] **Discord Bot Setup Guide**
- [x] **Discord Test Connection Button**
- [x] **Custom Discord Alert Patterns**
- [x] **Wealthsimple Trade Support** (9th broker)
- [x] **Backend Refactoring (Phase 1 & 2)** - Modular routes in `routes/` directory
- [x] **MongoDB to SQLite Migration** - Database abstraction layer in `database/`
- [x] **Frontend Refactoring** - Reusable components in `components/`
- [x] **Profiles Page Refactoring** - Modular components in `components/profiles/`
- [x] **ESLint TypeScript Configuration Fixed**
- [x] **Windows Desktop Application (Electron)**
- [x] **Order Input Validation**
- [x] **HTTP Connection Pooling**
- [x] **Multi-Profile & Per-Broker Settings System**

### Security Audit & Hardening (March 2026)

#### Backend (50 issues found, 40+ patched)
- [x] **API Authentication Middleware** (`server.py`)
  - `APIKeyMiddleware` validates `X-API-Key` header on every request
  - `/api/health` is the only exempt endpoint (used by health checks and Electron renderer)
  - `OPTIONS` preflight requests always pass through
  - Configured via `API_KEY` env var; auth disabled with startup warning if unset
- [x] **auto_trading_enabled defaults to False** (was True — prevented unintended live trades on first run)
- [x] **Broker credential sanitisation** — `check_broker_connection` no longer returns `str(e)`; exceptions are logged server-side only to prevent API keys leaking in error responses
- [x] **Race conditions fixed** — toggle endpoints use lock/guard patterns
- [x] **CORS hardened** — restricted from `*` to explicit allowed origins
- [x] **uvicorn bound to 127.0.0.1** — was binding to 0.0.0.0
- [x] **Loss counter endpoints authenticated**
- [x] **Broker switch endpoint authenticated**
- [x] **Deprecated `datetime.utcnow()` replaced** with timezone-aware equivalents
- [x] **aiohttp connection pooling** — single session per broker, no per-request session creation
- [x] **ReDoS risk in regex** — patterns compiled with length limits

**Backend manual items still outstanding (require structural rewrites):**
- [ ] **C3** — Full `aiosqlite` rewrite of `SQLiteDatabase` (currently blocking calls in async context)
- [ ] **C4** — Encrypt broker credentials at rest (keyring, SQLCipher, or env vars)
- [ ] **C11** — IBKR: implement real contract ID lookup via `/iserver/secdef/search`
- [ ] **C16** — Atomic loss counter increment (use DB-level `UPDATE … SET` not read-modify-write)
- [ ] **M1** — Advisory lock around `update_settings` to prevent race condition
- [ ] **M2** — Replace `get_portfolio_summary` 1000-row load with DB-level aggregation
- [ ] **M5** — Merge `ProfileSettings` into `BrokerSettings`, remove deprecated endpoints
- [ ] **M6** — Separate runtime state from configuration in `Settings` model

#### Frontend (49 issues found, all patched)
- [x] **Shared infrastructure**
  - `constants/config.ts` — validates `EXPO_PUBLIC_BACKEND_URL` at startup
  - `constants/brokers.ts` — single source of truth for broker metadata
  - `types/profiles.ts` — shared TypeScript interfaces
  - `utils/format.ts` — shared formatting helpers (no more per-file duplicates)
  - `utils/api.ts` — axios instance with `X-API-Key` request interceptor
  - `utils/apiKey.ts` — reads key from Electron URL injection or env var
- [x] **Input validation** — prices, percentages, profile names all validated before API calls
- [x] **Async safety** — loading guards on all mutating operations, `Promise.all` for parallel fetches
- [x] **Error surfacing** — user-action failures show `Alert.alert` instead of silent `console.error`
- [x] **Confirmation dialogs** — destructive actions (reset loss counters, close trade, delete profile) require confirmation
- [x] **`data-testid` → `testID`** — all native elements use correct React Native attribute
- [x] **`AppState` polling guard** — dashboard 5s polling pauses when app is backgrounded
- [x] **Unsaved changes guard** — broker-config warns before back navigation if changes unsaved
- [x] **`BrokerRow` Switch/TouchableOpacity split** — fixes Android double-fire bug (M22)
- [x] **`CreateProfileModal`** — replaced `position: absolute` hack with proper RN `<Modal>`
- [x] **`SettingRow` debounce** — 600ms debounce before firing API calls on numeric input
- [x] **Discord token field** — never displays the stored token value

#### Desktop / Electron (14 issues found, all patched)
- [x] **Session API key auto-generation** — `crypto.randomBytes(32)` key generated at startup, injected into backend process env and exposed to renderer via IPC. No manual configuration required.
- [x] **`webSecurity: true` + `allowRunningInsecureContent: false`** — were missing from `webPreferences`
- [x] **Content Security Policy** — applied via `session.defaultSession.webRequest.onHeadersReceived`; also added as meta tag in `index.html`
- [x] **Backend health check endpoint** — renderer now polls `/api/health` (auth-exempt) not `/api/status` (would always 401)
- [x] **Backend startup race** — `safeResolve`/`safeReject` pattern; stdout listener resolves first, 8s timeout is true last-resort
- [x] **stderr surfaced** — buffered and sent to renderer on crash; not just `console.error`
- [x] **Crash recovery** — backend restarts up to 3 times on non-zero exit
- [x] **Windows force-kill** — `taskkill /F /PID` on Windows instead of `SIGTERM`
- [x] **`app.setAppUserModelId`** — Windows taskbar grouping
- [x] **`postMessage` origin hardened** — was `'*'`; now targets `http://localhost:8001`
- [x] **API key injected into iframe** — via `?apikey=` URL param, cleaned from URL bar after read
- [x] **Build scripts** — added `--add-data` for `routes/` and `database/`, `--hidden-import` for `aiosqlite`, `motor`, `pymongo`, `discord`

#### CI/CD Workflows (all rewritten March 2026)
- [x] **`ci.yml`** — Three jobs: backend (ruff lint, pyright, compile check, pytest), frontend (ESLint, tsc, raw env var usage check, data-testid check), desktop (JS syntax check, security flag verification)
- [x] **`build-apk.yml`** — EAS build with `--frozen-lockfile`, tsc pre-check, correct `permissions: contents: read`
- [x] **`build-windows.yml`** — Full Windows build pipeline: PyInstaller (with all `--add-data` dirs), Expo web export, Electron NSIS installer, security flag verification step, artifact upload, GitHub Release on tag push. Uses `windows-latest` runner; `permissions: contents: write` only on this job.

## Auth Setup
Add to `.env` files before running:

```
# backend/.env
API_KEY=your-secret-here          # omit in desktop mode — Electron generates it automatically

# frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
EXPO_PUBLIC_API_KEY=your-secret-here   # omit in desktop mode — Electron injects it at runtime
```

**Desktop mode:** `API_KEY` is auto-generated as a `crypto.randomBytes(32)` hex string on every Electron launch and passed to both the backend process and the frontend iframe automatically. No `.env` configuration needed for desktop users.

## Tech Stack
- **Frontend:** Expo (React Native), expo-router, TypeScript
- **Backend:** FastAPI (Python), Pydantic
- **Database:** MongoDB (motor for async), SQLite (for desktop)
- **Desktop:** Electron, PyInstaller
- **CI/CD:** GitHub Actions
- **Build Service:** Expo Application Services (EAS)

## File Structure
```
/app
├── .github/workflows/
│   ├── ci.yml                   # Lint, type-check, tests (backend + frontend + desktop)
│   ├── build-apk.yml            # EAS APK build
│   └── build-windows.yml        # Electron Windows installer build
├── backend/
│   ├── database/
│   │   ├── __init__.py
│   │   └── abstraction.py       # MongoDB + SQLite implementations behind DatabaseInterface
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py            # /api/health (auth-exempt)
│   │   ├── brokers.py
│   │   ├── settings.py
│   │   ├── discord.py
│   │   ├── profiles.py
│   │   └── trading.py
│   ├── models/__init__.py
│   ├── broker_clients/__init__.py
│   ├── utils/__init__.py
│   ├── server.py                # APIKeyMiddleware, app factory (~190 lines)
│   ├── database_sqlite.py       # Legacy — kept for compatibility
│   ├── requirements.txt
│   └── .env                     # API_KEY (backend)
├── desktop/                     # Electron shell (replaces electron/ — both exist in repo)
│   ├── main.js                  # Session key generation, backend spawn, CSP, crash recovery
│   ├── preload.js               # Context bridge: getApiKey, onBackendCrashed
│   ├── renderer.js              # Health poll (/api/health), API key injection into iframe
│   ├── index.html               # CSP meta tag
│   ├── styles.css
│   ├── package.json
│   ├── build.bat                # Windows build script (all --add-data dirs included)
│   └── build.sh                 # Linux/macOS cross-compile script
├── frontend/
│   ├── app/
│   │   ├── index.tsx            # Dashboard (AppState polling guard)
│   │   ├── positions.tsx
│   │   ├── trades.tsx
│   │   ├── alerts.tsx
│   │   ├── settings.tsx
│   │   ├── profiles.tsx
│   │   └── broker-config.tsx    # Unsaved-changes guard on back navigation
│   ├── components/
│   │   ├── profiles/
│   │   │   ├── SettingRow.tsx   # 600ms debounce, range validation
│   │   │   ├── BrokerSettings.tsx
│   │   │   ├── BrokerRow.tsx    # Switch separated from TouchableOpacity (Android fix)
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── CreateProfileModal.tsx  # Proper RN <Modal>
│   │   │   └── index.ts
│   │   ├── AutoTradingCard.tsx
│   │   ├── RiskManagementCards.tsx
│   │   ├── ToggleCard.tsx
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts            # Validated BACKEND_URL
│   │   └── brokers.ts           # Single source of truth for broker metadata
│   ├── types/
│   │   └── profiles.ts          # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── api.ts               # Axios instance with X-API-Key interceptor
│   │   ├── apiKey.ts            # Key resolution: Electron URL param → env var
│   │   └── format.ts            # Shared formatters (no per-file duplication)
│   ├── eas.json
│   ├── app.json
│   └── package.json
├── tests/                       # Backend pytest suite
├── memory/
│   └── PRD.md                   # This file
└── README.md
```

## Key API Endpoints
All endpoints require `X-API-Key` header except `/api/health`.

- `GET /api/health` — Health check (auth-exempt; used by Electron renderer on startup)
- `GET /api/status` — Bot status
- `GET/PUT /api/settings` — App settings
- `POST /api/broker/switch/{id}` — Switch active broker
- `POST /api/broker/check/{id}` — Check broker connection
- `GET/POST /api/averaging-down-settings`
- `POST /api/toggle-averaging-down`
- `GET /api/positions`
- `POST /api/sell-position/{id}`
- `GET/PUT /api/risk-management-settings`
- `POST /api/toggle-take-profit`, `/api/toggle-stop-loss`, `/api/toggle-trailing-stop`
- `GET/PUT /api/auto-shutdown-settings`
- `POST /api/toggle-auto-shutdown`, `/api/reset-loss-counters`
- `GET/PUT /api/premium-buffer-settings`
- `POST /api/toggle-premium-buffer`
- `GET/POST /api/discord/alert-patterns`
- `POST /api/discord/test-connection`
- `GET /api/profiles`, `POST /api/profiles`
- `POST /api/profiles/{id}/activate`, `DELETE /api/profiles/{id}`
- `GET /api/profiles/{id}/all-broker-settings`
- `PUT /api/profiles/{id}/brokers/{broker_id}/settings`
- `POST /api/profiles/{id}/brokers/{broker_id}/settings/toggle/{setting}`

## Discord Alert Formats
- **Buy:** Standard format with ticker, strike, expiration, entry price
- **Sell:** "SELL 50% $SPY", "TRIM 25% $AAPL", "CLOSE $TSLA"
- **Average Down:** "AVERAGE DOWN $SPY", "AVG DOWN $QQQ", "ADD TO $AAPL"

## Prioritized Backlog

### P0 — Security (outstanding manual items)
- [ ] **C3** — Rewrite `SQLiteDatabase` to use `aiosqlite` properly (blocking I/O in async context)
- [ ] **C4** — Encrypt broker credentials at rest (keyring / SQLCipher)
- [ ] **C11** — IBKR real contract ID lookup via `/iserver/secdef/search`
- [ ] **C16** — Atomic loss counter increment at DB level

### P1 — Reliability
- [ ] **M1** — Advisory lock around `update_settings`
- [ ] **M2** — DB-level aggregation in `get_portfolio_summary` (currently loads up to 1000 rows)
- [ ] **M5** — Merge `ProfileSettings` into `BrokerSettings`, remove deprecated endpoints
- [ ] **M6** — Separate runtime state from config in `Settings` model
- [ ] Add WebSocket for real-time updates (replace 5s polling)

### P2 — Quality
- [ ] Unit tests for broker integrations
- [ ] Expand pytest coverage for all route modules
- [ ] Add notification system for trade alerts
- [ ] ESLint/tsc with zero warnings enforced in CI (currently `continue-on-error: true`)

## Setup Instructions

### Required Secrets (GitHub Actions)
| Secret | Required for | How to get |
|--------|-------------|------------|
| `EXPO_TOKEN` | `build-apk.yml` | expo.dev → Account Settings → Access Tokens |
| `GITHUB_TOKEN` | `build-windows.yml` (auto) | Provided automatically by Actions |

### Required: EAS Token Setup
1. Go to [expo.dev](https://expo.dev) and log in
2. Navigate to **Account Settings** → **Access Tokens**
3. Create a new token with appropriate permissions
4. In your GitHub repo: **Settings** → **Secrets and variables** → **Actions**
5. Add secret: `EXPO_TOKEN` with your token value

### Before First Build
Update `frontend/app.json`:
- Replace `com.yourcompany.tradebot` with your actual package identifier
- Replace `your-project-id` with your EAS project ID
- Replace `your-expo-username` with your Expo account name
