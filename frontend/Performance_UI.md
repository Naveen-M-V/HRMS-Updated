# Performance UI

Admin pages:
- `/admin/performance` - Index linking to sections.
- `/admin/performance/notes` - List notes for a given employee (enter employee ID and Load).
- `/admin/performance/notes/create` - Create a note (employeeId, visibility, content).
- `/admin/performance/disciplinary` - List disciplinary records for employee.
- `/admin/performance/disciplinary/create` - Create disciplinary record.
- `/admin/performance/pips` - List improvement plans.
- `/admin/performance/pips/create` - Create improvement plan.

Frontend API helper: `frontend/src/utils/performanceApi.js` exposes `goalsApi`, `reviewsApi`, `notesApi`, `disciplinaryApi`, `pipsApi`.

Usage
- Admins should open Admin > Performance to manage records.
- Employees see their performance tab at `/user-dashboard?tab=performance` which shows reviews, goals, PIPs and notes (if allowed).

Quick dev steps
```bash
# frontend
cd frontend
npm start
# backend
cd backend
npm start
```
