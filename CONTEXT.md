# CONTEXT: KanPlan

KanPlan is a personal productivity web application that merges **Agile Kanban WIP limits** with **Calendar Time Blocking**. It helps individuals manage their workload by preventing overcommitment and scheduling dedicated execution windows.

## Ubiquitous Language & Domain Terms

### Kanban & WIP Constraints
- **Column**: A stage in the workflow (`Backlog`, `Ready to Start`, `In Progress`, `Done`, or custom user-defined columns). Each column has an optional **WIP Limit**.
- **WIP Limit (Work-In-Progress Limit)**: The maximum number of tasks allowed simultaneously in a column. Moving a task into a full column is **hard-rejected**.
- **Backlog**: The holding column for unscheduled or low-priority tasks with no WIP limit.

### Eisenhower Matrix Prioritization
- **Eisenhower Quadrants**: A 2-axis prioritization system classifying tasks by:
  - **Urgent**: Requires immediate attention.
  - **Important**: Contributes to long-term goals.
- **Quadrants**:
  - *Do First*: Urgent & Important.
  - *Schedule / Time-Block*: Not Urgent & Important.
  - *Delegate / Quick*: Urgent & Not Important.
  - *Backlog / Eliminate*: Not Urgent & Not Important.

### Time Blocking & Calendar Sync
- **Time Block**: A scheduled window on the calendar grid defined by `schedule_start` and `schedule_end` timestamps.
- **Deadline**: The target completion timestamp for a task.
- **Schedule Overlap Warning**: A visual indicator (warning badge / red outline) displayed when two or more scheduled time blocks overlap in time.
- **Completed History Styling**: Completed tasks (`Done`) retain their historical time-blocks on the calendar grid but receive visual progress styling (e.g. dimmed/green state).

### UI Views
- **Split View**: Side-by-side view featuring the Kanban board on the left and the Day/Week Calendar grid on the right.
- **Kanban View**: Full-screen focused Kanban board.
- **Calendar View**: Full-screen focused Day/Week calendar grid.
- **Login Page**: A dedicated `/login` route displaying a "Sign in with Google" button. Unauthenticated users are redirected here.

### Authentication & Accounts
- **Account**: A registered user identity, created automatically on first Google OAuth sign-in. Stored in the `accounts` table with Google-provided profile data (google_id, email, name, avatar_url).
- **Session**: A server-side record linking an HTTP-only cookie token to an Account. Stored in the D1 `sessions` table. All API requests require a valid session.
- **Row-Level Isolation**: Every `tasks` and `columns` row carries an `account_id` foreign key. All queries filter by the authenticated Account — one shared D1 database, logically isolated per user.
