# 🎯 KanPlan

> Agile Kanban WIP Limits + Calendar Time Blocking with Google OAuth & Multi-Tenant Cloud Storage

🌐 **Live Production App:** [https://kanplan-app.pages.dev](https://kanplan-app.pages.dev)

---

## 🌟 Overview

**KanPlan** combines the flow control of Agile Kanban boards (Work-In-Progress limits) with daily Calendar Time Blocking. It is designed to prevent focus overflow, prioritize high-impact work, and seamlessly schedule tasks into calendar time slots.

Built with **React**, **Hono.js**, and **Cloudflare D1 (SQLite)**, KanPlan offers real-time multi-tenant row-level data isolation secured by **Google OAuth 2.0**.

---

## ✨ Key Features

### 🔐 Google OAuth Authentication & Multi-Tenant Cloud Storage
- One-click Google Login.
- Row-level data security where each account gets independent, isolated columns and tasks backed by Cloudflare D1.

### 📋 Agile Kanban Board & WIP Limits
- Default workflow: **Backlog**, **Ready to Start** (WIP: 3), **In Progress** (WIP: 2), and **Done**.
- Configurable WIP limits per column to prevent multitasking and burnout.
- **Interactive WIP Swap Modal**: Prompted when moving tasks into full columns, letting users return older tasks to Backlog.

### ⏱️ Calendar Time Blocking & Drag Interception
- Seamless **FullCalendar** integration for 30-minute time slot scheduling.
- Dragging unscheduled tasks into **Ready to Start** triggers an interactive **Schedule Time Block** modal.
- Drag-and-drop directly onto the calendar to schedule or resize durations.

### 🔥 Priority Heatmap & Automatic Urgency Escalation
- **1–25 Priority Score**: Calculated from Urgency (1–5) × Importance (1–5).
- **4-Tier Heatmap Styling**:
  - 🔥 **Critical (20–25)**: Rose tint & red border
  - 🔶 **High (15–19)**: Orange tint & orange border
  - ⚡ **Medium (10–14)**: Yellow tint & yellow border
  - 📥 **Low (1–9)**: Slate styling
- **Automatic Urgency Escalation**: Urgency automatically increases as due dates approach (<3 days = +1, <1 day = 5).

### 🔍 Priority Sort & Tier Filters
- Sort board columns by **Highest Priority First** or **Lowest Priority First**.
- Filter task cards by specific priority tiers (**Critical**, **High**, **Medium**, **Low**).

### 🗑️ Task Management & Persistence
- Hover-activated deletion buttons on task cards.
- Real-time optimistic UI updates backed by Cloudflare Pages API endpoints.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, FullCalendar, `@hello-pangea/dnd`
- **Backend Framework:** Hono.js running on Cloudflare Pages Functions
- **Database:** Cloudflare D1 (Serverless SQLite)
- **Authentication:** Google OAuth 2.0 + Secure Session Cookies

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: v20+
- **npm**: v10+

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ymsrubio/KanPlanLegacy.git
   cd KanPlanLegacy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure local environment variables:**
   Create a `.dev.vars` file in the root directory:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   APP_URL=http://localhost:8788
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` or `http://localhost:8788` in your browser.

5. **Run the automated test suite:**
   ```bash
   node --test tests/auth-service.test.js tests/api.test.js tests/wip-limit.test.js tests/column-service.test.js tests/schema.test.js
   ```

---

## 📄 License

MIT License. Designed and developed with care.
