## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
 
 CanvasCodeEditor.tsx — Change Log

**Date:** 2026-04-04  
**File changed:** `src/components/student/CanvasCodeEditor.tsx`

---

## Bug Fixes

### 1. Robot direction system was broken (critical)
**Problem:** All levels used `start: { x, y }` but the robot always started with `dir: 0`. Direction 0 was intended to mean "facing right", but the arrow drawn on the robot used a CSS triangle that pointed _down_ (using `border-b`), and many levels (coding-3 through coding-6) start the robot in the bottom-left needing to move _up_. The robot visually pointed the wrong way and moved incorrectly.

**Fix:**
- Added `startDir` field to every `LevelConfig` and `LEVELS` entry. Levels that start bottom-left and need to go up are given `startDir: 3` (up). Levels starting top-left going right are given `startDir: 0`.
- Updated `robotPos` initial state, all resets (`handleReset`, `useEffect` module-change reset, auto-run reset), and `handleRun` to use `level.startDir` instead of hardcoded `0`.
- Replaced the robot's CSS arrow (`border-b` triangle, which pointed down at 0 deg) with a `border-l` triangle (points right at 0 deg). Now `dir * 90` degrees of CSS rotation correctly maps: `0=right, 1=down, 2=left, 3=up`.

---

### 2. Robot arrow visual was misaligned with direction
**Problem:** The original arrow used `border-b-[14px] border-b-white rotate-90 ml-2`, which rendered a downward-pointing chevron then rotated it. The final visual pointed right but the `ml-2` offset made it asymmetric inside the robot cell.

**Fix:** Replaced with a clean single-element CSS arrow using only `border-l` (the classic right-pointing triangle), centered without manual margin offsets.

---

### 3. `handleRun` did not reset robot position before each run
**Problem:** Pressing "Run" multiple times without resetting would continue from wherever the robot last stopped, rather than from the start position.

**Fix:** Added `setRobotPos({ ...level.start, dir: level.startDir })` at the very top of `handleRun` so every run always starts from the correct position and direction.

---

### 4. No touch/mobile support for drag-and-drop
**Problem:** The canvas drag logic used only `mousedown`, `mousemove`, and `mouseup` events. On touch devices (tablets, phones — which are common in classroom settings), blocks could not be dragged at all.

**Fix:**
- Added a `getPointerPos()` helper that normalises both `MouseEvent` and `TouchEvent` to `{ x, y }` relative to the canvas.
- Added `touchstart`, `touchmove`, and `touchend` event listeners alongside the existing mouse ones, using `{ passive: false }` and `e.preventDefault()` to prevent scroll interference while dragging.
- Added `touch-none` Tailwind class to the canvas element to suppress browser default touch behaviour.

---

### 5. `handleReset` only cleared executing state, kept all blocks
**Problem:** Clicking Reset cleared the `isExecuting` flag and moved the robot back, but left all dragged blocks in the workspace. Users had to manually delete every block to start fresh.

**Fix:** `handleReset` now filters `workspaceBlocks` to keep only the `'start'` (When Run) anchor block, clearing all user-placed blocks. Also resets `lastSequence` so the auto-run effect fires cleanly on the next change.

---

### 6. Module-change reset did not clear `lastSequence`
**Problem:** When navigating from one module to another, `lastSequence` was not reset. If the new module happened to produce the same sequence string, the auto-run effect would not fire.

**Fix:** Added `setLastSequence('')` to the module-change `useEffect`.

---

### 7. `getChain` had no cycle-guard
**Problem:** If blocks somehow formed a cycle (e.g. block A connected to block B, B connected to A), `getChain` would loop forever, freezing the app.

**Fix:** Added a `visited` Set inside `getChain` to break out of any cycle.

---

### 8. Grid layout positioning used percentage offsets that could cause off-by-one visual clipping
**Problem:** Robot and target cells used `left: ${n * 20 + 2}%` which, at some viewport sizes, pushed the cell slightly outside the visible grid row/column.

**Fix:** Changed the `+2` offset to `+1` so cells are inset uniformly and remain within their grid cell at all viewport sizes.

---

## No-change notes
- The block workspace canvas rendering (draw, snap highlight, shadow, tab notch) is unchanged in behaviour.
- Quiz logic, XP, badge, and database code are untouched.
- All level puzzles (`LEVELS`) are preserved exactly; only `startDir` was added to each entry.




2. Run the app:
   `npm run dev`
