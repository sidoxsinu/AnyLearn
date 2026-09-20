## 2026-09-20T01:51:04Z

# Task Assignment — Worker M1 (Design System, Tokens, App Shell & Assets)

**Working Directory**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_worker_ui_m1`
**Role**: `teamwork_preview_worker`
**Original Request**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`
**Project Architecture**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/PROJECT.md`
**Explorer Survey Handoff**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_1/handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Files Owned Exclusively
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/AppShell/*` (`AppShell.tsx`, `TopBar.tsx`, `CurvedNotchNav.tsx`, `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`)
- `src/components/FluentEmoji.tsx`
- `public/assets/*`

## Objectives
1. Read `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md` and the survey report in `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_1/handoff.md`.
2. Configure dependencies in `package.json` (Tailwind v4, `@tailwindcss/postcss`, `framer-motion` or `motion`, `canvas-confetti`, `@types/canvas-confetti`). Run `npm install` and ensure dependencies resolve cleanly.
3. Create `postcss.config.mjs` and `tailwind.config.ts` defining all Dei tokens:
   - Colors: `mint #CFF7D3`, `lavender #F1D3FA`, `butter #FBE8B0`, `sky #D5F1F7`, `pink #FF8FC7`, `black #0A0A0A`, `off-white #F7F7F7`, `grey #F0F0F0`
   - Typography: Plus Jakarta Sans / Outfit
   - Radius: `panel: 40px`, `panel-sm: 20px`, `pill: 9999px`
4. Set up `src/app/globals.css` with `@import "tailwindcss";`, `@config "../../tailwind.config.ts";`, `@theme` variables, and custom scrollbars. Ensure CSS variables for mastery (`--mastery-untouched`, `--mastery-weak`, `--mastery-ok`, `--mastery-solid`) are preserved for test compatibility.
5. Create the complete App Shell in `src/components/AppShell/`:
   - `AppShell.tsx`: Outer black shell (`#0A0A0A`), top bar, responsive inner container with off-white panel (`#F7F7F7`, 40px radius) and right secondary panel (`#F0F0F0`, collapses below `lg`), floating bottom toolbar.
   - `TopBar.tsx`: Black top bar, "AnyLearn" wordmark, center curved notch nav, right avatar dropdown.
   - `CurvedNotchNav.tsx`: Route-aware navigation with active pill and inverted curved notch SVG connecting to the content panel. Every button has an explicit `aria-label`.
   - `AvatarDropdown.tsx`: Circular avatar with dropdown menu and `aria-label="User profile and settings"`.
   - `SecondaryPanel.tsx`: Right panel in #F0F0F0 with rounded corners, hidden on mobile/tablet (`hidden lg:flex`).
   - `FloatingToolbar.tsx`: Black pill with 6 colorful circular tool buttons (lavender, sky, pink, butter, mint, dark "+"), all with `aria-label`.
6. Update `src/app/layout.tsx` to mount `AppShell` with Plus Jakarta Sans / Outfit font.
7. Create `src/components/FluentEmoji.tsx` and illustration assets in `/public/assets/` (`hero-collage.svg`, `empty-state.svg`, `logo-mark.svg`).
8. Run `npm test` (all 80 tests must pass) and `npm run build` (must exit 0 with 0 errors).
9. Write a comprehensive report in `handoff.md` and send a message when complete.
