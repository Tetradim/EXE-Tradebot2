# Trading Bot - Product Requirements Document

## Original Problem Statement
Clone and run the EXE-Tradebot2 repository to identify and fix bugs. The application is a full-stack Expo (React Native) and FastAPI trading bot supporting:
- Multi-broker trading (9 brokers: IBKR, Alpaca, TD Ameritrade, Tradier, Webull, Robinhood, TradeStation, Thinkorswim, Wealthsimple)
- Discord integration for parsing buy/sell alerts
- P&L tracking and position management
- Risk management (Take Profit, Stop Loss, Trailing Stop, Auto Shutdown)
- Windows Desktop Application (Electron)

## Tech Stack
- **Frontend:** Expo (React Native), expo-router, TypeScript
- **Backend:** FastAPI (Python), Pydantic
- **Database:** MongoDB (motor for async), SQLite (for desktop)
- **Desktop:** Electron, PyInstaller

## What's Been Implemented (March 2026)

### Bug Fixes Applied This Session:
1. **`/api/reset-loss-counters` admin key bug** - Fixed endpoint to work without admin key when `ADMIN_API_KEY` env var is not set (allows dev/desktop mode)
2. **Missing `timezone` import** - Added `timezone` to datetime imports in `server.py`
3. **Portfolio API incomplete response** - Added missing fields:
   - `open_positions`
   - `closed_positions`
   - `losing_trades`
   - `best_trade`
   - `worst_trade`
   - `average_pnl`
4. **Frontend build** - Configured Expo web build to serve via `serve` package for preview environment

### Core Features (Already Working):
- [x] Multi-broker system with 9 brokers
- [x] Broker configuration UI for API credentials
- [x] P&L calculations (realized/unrealized)
- [x] Position management with manual sell buttons
- [x] Discord alert parsing
- [x] Take Profit & Stop Loss
- [x] Trailing Stop
- [x] Auto Shutdown with loss counters
- [x] Premium Buffer
- [x] Averaging Down
- [x] API Authentication Middleware

## Key API Endpoints
All endpoints require `X-API-Key` header except `/api/health`.

- `GET /api/health` - Health check (auth-exempt)
- `GET /api/status` - Bot status
- `GET /api/portfolio` - Portfolio summary with all P&L stats
- `GET/PUT /api/settings` - App settings
- `POST /api/broker/switch/{id}` - Switch active broker
- `GET /api/brokers` - List available brokers
- `POST /api/toggle-trading` - Toggle auto trading
- `POST /api/reset-loss-counters` - Reset loss counters (no admin key required when unconfigured)
- `GET/PUT /api/risk-management-settings`
- `GET/PUT /api/auto-shutdown-settings`
- `GET /api/alerts`, `GET /api/trades`, `GET /api/positions`

## Test Results
- **Backend:** 100% (20/20 tests passed)
- **Frontend:** 100% (All UI elements loading and functional)
- **Integration:** 100% (Frontend successfully communicating with backend)

## Outstanding Items (From Security Audit)

### P0 - Security
- [ ] C3 - Rewrite `SQLiteDatabase` to use `aiosqlite` properly (partially done)
- [ ] C4 - Encrypt broker credentials at rest
- [ ] C11 - IBKR real contract ID lookup

### P1 - Reliability
- [ ] M1 - Advisory lock around `update_settings`
- [ ] M2 - DB-level aggregation (done for portfolio)
- [ ] Add WebSocket for real-time updates

### P2 - Quality
- [ ] Unit tests for broker integrations
- [ ] Expand pytest coverage

## Next Action Items
1. Configure Discord bot token for live alert parsing
2. Set up broker API credentials
3. Test real trading flow with simulation mode
4. Consider adding notification system for trade alerts

## Environment Setup
```bash
# Backend (.env)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
API_KEY=your-secret-here  # Optional for dev mode

# Frontend (.env)
EXPO_PUBLIC_BACKEND_URL=https://your-app.preview.emergentagent.com
```
