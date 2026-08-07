# Research Report: React Calendar Engines for KanPlan Time-Blocking

**Date:** 2026-08-07  
**Author:** AI Research Sub-Agent  
**Primary Focus:** External Drag-and-Drop from Kanban, On-Calendar Drag & Resizing, React 19 Compatibility, and CSS Customization (`DESIGN.md`).

---

## Executive Summary

To achieve KanPlan's time-blocking vision (**dragging unscheduled tasks from a vertical Kanban sidebar directly onto an interactive hourly calendar, with 1-Day & 7-Day views, side-by-side overlap rendering, 30-min snapping, and custom warm-cream styling**), we evaluated the two primary modern React calendar engines: **FullCalendar (`@fullcalendar/react`)** and **Schedule-X (`@schedule-x/react`)**.

### Quick Comparison Matrix

| Feature / Metric | FullCalendar (`@fullcalendar/react`) | Schedule-X (`@schedule-x/react`) |
| :--- | :--- | :--- |
| **React 19 Support** | ✅ Fully Supported | ✅ Supported |
| **Native External Drag-and-Drop** | 🌟 Built-in (`@fullcalendar/interaction` `Draggable`) | ⚠️ Manual glue code needed (requires custom dnd-kit / HTML5 handlers) |
| **On-Calendar Drag & Resize** | 🌟 Built-in (`eventDrop` & `eventResize`) | ✅ Built-in via plugin |
| **Side-by-Side Overlapping Events** | 🌟 Automatic sub-column layout | ⚠️ Basic overlapping |
| **Custom CSS Themeing** | ✅ Extensive CSS variables & class overrides | 🌟 Modern CSS variables |
| **License** | MIT (Core / DayGrid / TimeGrid / Interaction) | MIT |
| **Production Maturity** | 🏆 Enterprise Gold Standard (Used by millions) | 🚀 Modern fast-growing newcomer |

---

## Detailed Findings

### 1. FullCalendar (`@fullcalendar/react`)

**Primary Sources:**
- Docs: [https://fullcalendar.io/docs/react](https://fullcalendar.io/docs/react)
- External Dragging Docs: [https://fullcalendar.io/docs/external-dragging](https://fullcalendar.io/docs/external-dragging)
- GitHub: [https://github.com/fullcalendar/fullcalendar](https://github.com/fullcalendar/fullcalendar)

#### Key Architectural Strengths:
1. **First-Party External Element Dragging (`@fullcalendar/interaction`)**:
   FullCalendar provides a dedicated `Draggable` class that attaches to external DOM elements (such as our `TaskCard` elements in `KanbanBoard`). When dragged over the calendar grid:
   - FullCalendar shows a live time-slot ghost preview.
   - Triggers `eventReceive(info)` when dropped, providing exact `start` and `end` Date objects automatically snapped to 30-minute intervals!
2. **Built-in Overlap Resolution**:
   Automatically splits overlapping time slots into side-by-side sub-columns (matching our Grill Q5 settled decision).
3. **Flexible TimeGrid Views**:
   Native support for `timeGridDay` (1-Day View) and `timeGridWeek` (7-Day Week View) out of the box (matching Grill Q2).
4. **CSS Variable Customization**:
   FullCalendar v6 uses standard CSS variables (`--fc-border-color`, `--fc-page-bg-color`, `--fc-event-bg-color`, `--fc-today-bg-color`), making it seamless to style with our `DESIGN.md` warm cream tokens (`#fffefb`, `#201515`, `#ff4f00`).

---

### 2. Schedule-X (`@schedule-x/react`)

**Primary Sources:**
- Docs: [https://schedule-x.dev/](https://schedule-x.dev/)
- GitHub: [https://github.com/schedule-x/schedule-x](https://github.com/schedule-x/schedule-x)

#### Key Architectural Strengths:
1. **Ultra-Modern Lightweight Engine**:
   Built from the ground up for modern web apps with native TypeScript and sleek modern UI.
2. **CSS Variable Native**:
   Uses modern CSS custom properties for theming.

#### Limitations for KanPlan:
1. **External Drag-and-Drop Complexity**:
   Schedule-X handles internal event moving via plugins, but dragging an item from an external Kanban board onto the calendar requires custom HTML5/dnd-kit event listeners and manual coordinate-to-time mapping.

---

## Recommendation & Architecture Seam Plan

### Winner: **FullCalendar (`@fullcalendar/react`)**

FullCalendar is the recommended engine for KanPlan because it provides **native external drag-and-drop integration (`@fullcalendar/interaction`)**, **automatic side-by-side overlap rendering**, and **proven React 19 compatibility** without requiring fragile custom coordinate-math glue code.

### Proposed Architecture Seam (`CalendarAdapter`)

To prevent third-party library lock-in, we will create a clean seam component **[src/components/CalendarGrid.jsx](file:///Users/yuanmiguelrubio/Documents/00_github.com/KanPlan/src/components/CalendarGrid.jsx)** wrapping FullCalendar:

```jsx
<CalendarGrid
  tasks={tasks}
  onScheduleChange={handleScheduleChange}
  onTaskDropFromKanban={handleTaskDropFromKanban}
/>
```

This ensures `App.jsx`, `KanbanBoard.jsx`, and Express REST API backend endpoints remain 100% decoupled from the underlying calendar engine!
