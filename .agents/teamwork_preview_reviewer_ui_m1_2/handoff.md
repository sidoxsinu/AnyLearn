# Handoff Report — Reviewer 2 (Milestone 1 Gate Review)

**Verdict**: `REQUEST_CHANGES`

## 1. Observation

1. **Build and Logic Test Verification**:
   - `npm test`: Exited with code 0.
     ```
     ℹ tests 80
     ℹ suites 0
     ℹ pass 80
     ℹ fail 0
     ℹ duration_ms 463.257375
     ```
   - `npm run build`: Exited with code 0.
     ```
     ✓ Compiled successfully in 777ms
     ✓ Generating static pages using 9 workers (7/7) in 108ms
     Finalizing page optimization in 2.2s
     ```

2. **TypeScript Compilation & Model Misalignments (`node node_modules/typescript/lib/tsc.js --noEmit`)**:
   `next.config.ts` includes `typescript: { ignoreBuildErrors: true }`. When running type checking directly, 8 TypeScript errors were identified across Worker M1's components:
   - `src/components/AppShell/SecondaryPanel.tsx:11:75`:
     ```
     error TS2551: Property 'lessons' does not exist on type 'Module'. Did you mean 'lessonIDs'?
     11   const totalLessons = course ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0) : 0;
     ```
   - `src/components/AppShell/SecondaryPanel.tsx:9:19`:
     ```
     error TS2339: Property 'completedLessons' does not exist on type 'AppState'.
     9   const { course, completedLessons } = useStore();
     ```
   - `src/components/AppShell/SecondaryPanel.tsx:17:23`:
     ```
     error TS2551: Property 'lessons' does not exist on type 'Module'. Did you mean 'lessonIDs'?
     17     .flatMap((m) => m.lessons)
     ```
   - `src/components/AppShell/SecondaryPanel.tsx:41:91`:
     ```
     error TS2339: Property 'title' does not exist on type 'Course'.
     41   <h3 className="text-base font-extrabold mt-1 text-black leading-snug">{course.title}</h3>
     ```
   - `src/components/AppShell/FloatingToolbar.tsx:9:19`:
     ```
     error TS2339: Property 'currentLessonID' does not exist on type 'AppState'.
     9   const { course, currentLessonID, completedLessons } = useStore();
     ```
   - `src/components/AppShell/FloatingToolbar.tsx:9:36`:
     ```
     error TS2339: Property 'completedLessons' does not exist on type 'AppState'.
     ```
   - `src/components/AppShell/FloatingToolbar.tsx:12:55`:
     ```
     error TS2551: Property 'lessons' does not exist on type 'Module'. Did you mean 'lessonIDs'?
     12   const allLessons = course?.modules.flatMap((m) => m.lessons) || [];
     ```
   - `src/components/AppShell/AvatarDropdown.tsx:67:32`:
     ```
     error TS2339: Property 'title' does not exist on type 'Course'.
     67   {course ? course.title : 'Ready to Learn'}
     ```

3. **Runtime Crash Reproduction**:
   Executing the line from `SecondaryPanel.tsx:11` with `pcbCourseFixture`:
   ```bash
   node -e "
   import('./src/lib/fixture.ts').then(({ pcbCourseFixture }) => {
     const totalLessons = pcbCourseFixture.modules.reduce((acc, m) => acc + m.lessons.length, 0);
   });
   "
   ```
   Result: Verbatim crash:
   `TypeError: Cannot read properties of undefined (reading 'length')`
   Because `m` is a `Module` (which has `lessonIDs: ID[]`, not `lessons`), `m.lessons` is `undefined`, causing an immediate uncaught client crash in React whenever a course exists in the store.

4. **FloatingToolbar Routing Breakdown**:
   In `FloatingToolbar.tsx:12-16`, because `m.lessons` is undefined, `allLessons` evaluates to `[undefined, undefined, ...]`. Consequently, `targetLessonID` is always undefined. All three dynamic tool buttons (Lesson, Quiz, Changelog) permanently default to `/roadmap` instead of their respective routes (`/lesson/[id]`, `/quiz/[id]`, `/report/[id]`).

5. **Curved Notch Navigation (`src/components/AppShell/CurvedNotchNav.tsx`)**:
   - Notch geometry: `<path d="M0 0 Q10 0 15 8 L25 8 Q30 0 40 0 Z" fill="var(--off-white)" />`
   - Container has `aria-hidden="true"` and `pointer-events-none`.
   - Active pill has `bg-off-white text-black`.
   - All 4 navigation items have explicit `aria-label` and `focus-visible:ring-2 focus-visible:ring-white`.

6. **FluentEmoji Component (`src/components/FluentEmoji.tsx`)**:
   - All 16 emojis are supported (🎓, 🧠, 🗺️, 🎯, 🔒, ✅, ❌, 🎉, 👏, ⏱️, 🔧, ✨, 🚀, 📚, 🧬, 💡).
   - Zero hardcoded hex colors: all colors use CSS variables (`var(--sky)`, `var(--black)`, `var(--butter)`, `var(--pink)`, `var(--mint)`, `var(--lavender)`).
   - Semantic `<span role="img" aria-label={label}>` wrapper.

7. **Design System & Assets**:
   - `tailwind.config.ts` and `src/app/globals.css` define all 8 Dei tokens and 4 mastery states.
   - Assets `public/assets/logo-mark.svg`, `public/assets/empty-state.svg`, and `public/assets/hero-collage.svg` are valid, rich SVGs following Dei specifications.

8. **Responsiveness (375px mobile vs 1440px desktop)**:
   - `SecondaryPanel` has `hidden lg:flex` (properly collapsed on mobile, visible on desktop).
   - `AppShell` inner panel has `rounded-[20px] md:rounded-[28px] lg:rounded-panel`.
   - `FloatingToolbar` has width 304px on mobile, fitting comfortably within 375px.
   - Minor observation: `TopBar` on 375px is tight; wordmark text `AnyLearn` should have `hidden sm:inline` to avoid crowding `CurvedNotchNav`.

---

## 2. Logic Chain

1. Per Observation 1, unit tests (`npm test`) only test `src/lib/` functions and do not render React components. Production build (`npm run build`) succeeded only because `typescript: { ignoreBuildErrors: true }` suppressed compiler errors.
2. Per Observation 2 and 3, `SecondaryPanel.tsx:11` attempts to access `m.lessons.length` on `Module` objects. According to `src/lib/models.ts`, `Module` has `lessonIDs: ID[]`. Because `m.lessons` is `undefined`, accessing `.length` triggers a fatal `TypeError: Cannot read properties of undefined (reading 'length')`. Because `SecondaryPanel` is rendered in `AppShell` inside `RootLayout`, loading any course into the store immediately crashes every page of the application on the client.
3. Per Observation 2 and 4, `FloatingToolbar.tsx` references `completedLessons` and `currentLessonID` directly from `useStore()`. These properties do not exist on `AppState` (`learner.completedLessonIDs` exists). Together with `m.lessons` being undefined, `targetLessonID` is always undefined, breaking the floating toolbar's intended functionality.
4. Per Observation 2, `course.title` is referenced in `AvatarDropdown.tsx:67` and `SecondaryPanel.tsx:41`. In `models.ts`, `Course` has `profile.topic` and `goal`, not `title`.
5. Therefore, while visual styling, tokens, CurvedNotchNav geometry, and FluentEmoji are well constructed, Milestone 1 cannot be approved in its current state because the shell crashes at runtime upon loading course data and has broken floating toolbar links.

---

## 3. Caveats

- Milestone 1 review was scoped to R1 and R2: tokens, layout shell, AppShell components, FluentEmoji, assets, and responsiveness.
- Page redesigns (R3) and component library items (R4) belong to subsequent milestones (M2, M3, M4) and were not reviewed.
- `ignoreBuildErrors: true` in `next.config.ts` was noted by Worker M1 as necessary for existing non-standard exports in `/quiz` and `/report` pages, but it also masked type errors in M1's own components.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

Worker M1 must address the following required fixes before Milestone 1 can pass gate review:

### Critical Fixes (Must Fix):
1. **Fix fatal runtime crash in `src/components/AppShell/SecondaryPanel.tsx`**:
   - Replace `const { course, completedLessons } = useStore();` with `const { course, learner } = useStore();`.
   - Update `totalLessons` to use `m.lessonIDs.length` or `Object.keys(course.lessons).length`:
     ```tsx
     const totalLessons = course ? course.modules.reduce((acc, m) => acc + m.lessonIDs.length, 0) : 0;
     ```
   - Update `completedCount` to use `learner.completedLessonIDs`:
     ```tsx
     const completedCount = learner?.completedLessonIDs ? learner.completedLessonIDs.length : 0;
     ```
   - Update `nextLesson` resolution:
     ```tsx
     const nextLesson = course?.modules
       .flatMap((m) => m.lessonIDs)
       .map((id) => course.lessons[id])
       .find((l) => l && !learner?.completedLessonIDs?.includes(l.id));
     ```
   - Replace `course.title` with `course.profile?.topic || course.goal`.

2. **Fix link resolution in `src/components/AppShell/FloatingToolbar.tsx`**:
   - Access `learner` from `useStore()`.
   - Correctly resolve `allLessonIDs` and `targetLessonID`:
     ```tsx
     const { course, learner } = useStore();
     const allLessonIDs = course?.modules.flatMap((m) => m.lessonIDs) || [];
     const targetLessonID =
       allLessonIDs.find((id) => !learner?.completedLessonIDs?.includes(id)) ||
       allLessonIDs[0];
     ```

### Major Fixes:
3. **Fix `src/components/AppShell/AvatarDropdown.tsx:67`**:
   - Replace `course.title` with `course.profile?.topic || course.goal`.

### Minor Improvements:
4. **TopBar Mobile Density (`src/components/AppShell/TopBar.tsx`)**:
   - Add `hidden sm:inline` to the `AnyLearn` text inside the wordmark link so that on 375px screens the icon nav is not crowded.

---

## 5. Verification Method

1. Run TypeScript check to ensure no type errors in AppShell components:
   ```bash
   node node_modules/typescript/lib/tsc.js --noEmit
   ```
   Verify 0 errors in `src/components/AppShell/`.
2. Run runtime verification script:
   ```bash
   node -e "
   import('./src/lib/fixture.ts').then(({ pcbCourseFixture }) => {
     const totalLessons = pcbCourseFixture.modules.reduce((acc, m) => acc + m.lessonIDs.length, 0);
     const allLessonIDs = pcbCourseFixture.modules.flatMap(m => m.lessonIDs);
     console.log('Total lessons:', totalLessons, 'All IDs:', allLessonIDs);
   });
   "
   ```
   Verify it outputs valid numbers without throwing.
3. Run test suite:
   ```bash
   npm test
   ```
   Verify all 80 tests pass.
4. Run production build:
   ```bash
   npm run build
   ```
   Verify exit code 0.
