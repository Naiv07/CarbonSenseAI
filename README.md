# CarbonSenseAI

A personal carbon footprint tracker and climate action platform powered by Gemini AI. Built as a hackathon project.

## Features

- **Carbon Calculator** — Track emissions across transport, energy, food, waste, and shopping
- **AI Advisor** — Gemini-powered advisor that gives warm, personalised tips based on your actual footprint data
- **Challenges** — Join climate challenges with interactive task checklists and progress tracking; refreshes weekly with personalised picks based on your habits and location
- **Daily Insight** — AI-generated daily environmental briefing tailored to your city, cached per day
- **Insights & Simulation** — What-if scenarios (EV adoption, solar, plant-based diet) with projected savings charts
- **Profile & Achievements** — Track XP, rank, streaks, badges, and joined challenges
- **Fully responsive** — Desktop sidebar + mobile bottom nav

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS |
| Backend | Node.js, Express, tsx |
| AI | Google Gemini 2.0 Flash (`@google/genai`) |
| State | In-memory server state (no database) |

## Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (must be **UTF-8** encoded):
   ```
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```
   Get a free key at [Google AI Studio](https://aistudio.google.com/apikey).

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── server.ts              # Express backend — all API routes + Gemini calls
├── src/
│   ├── App.tsx            # Root component, global state, API wiring
│   ├── types.ts           # Shared TypeScript interfaces
│   ├── components/
│   │   ├── DashboardView  # Overview + AI Advisor
│   │   ├── CalculatorView # Telemetry input form
│   │   ├── InsightsView   # Charts + what-if simulation
│   │   ├── GoalsView      # Challenges + task checklists
│   │   ├── DailyView      # Daily city insight (AI)
│   │   ├── ProfileView    # Stats, badges, activity log
│   │   ├── SettingsView   # App preferences
│   │   ├── OnboardingView # First-run setup
│   │   ├── Header         # Top nav bar
│   │   ├── Sidebar        # Desktop navigation
│   │   └── BottomNav      # Mobile navigation
│   └── context/
│       └── ToastContext   # Global toast notifications
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/telemetry` | Full app state snapshot |
| POST | `/api/telemetry` | Update emissions inputs |
| GET | `/api/challenges` | List challenges (auto-refreshes weekly) |
| POST | `/api/challenges/join` | Join or leave a challenge |
| POST | `/api/challenges/:id/tasks/:taskId/toggle` | Check/uncheck a task |
| POST | `/api/ai/commander` | Gemini AI advisor response |
| GET | `/api/daily-insight` | Gemini daily city insight (cached per day) |
| GET | `/api/logs` | Activity log |
| POST | `/api/simulation` | Update what-if simulation state |
| POST | `/api/reset` | Reset all data to defaults |

## Notes

- All state is in-memory — restarting the server resets everything
- The `.env` file **must be UTF-8 encoded** (not UTF-16); VS Code may save in UTF-16 if copy-pasted from certain sources
- Free tier Gemini quota is 1,500 requests/day — add billing at [Google AI Studio](https://aistudio.google.com) to lift the cap
