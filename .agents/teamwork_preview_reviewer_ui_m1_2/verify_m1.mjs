import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== Starting Reviewer 2 Verification ===');

// 1. Check FluentEmoji for all 16 required emojis
const fluentEmojiPath = path.resolve('src/components/FluentEmoji.tsx');
const fluentEmojiSrc = fs.readFileSync(fluentEmojiPath, 'utf8');

const requiredEmojis = [
  '🎓', '🧠', '🗺️', '🎯', '🔒', '✅', '❌', '🎉',
  '👏', '⏱️', '🔧', '✨', '🚀', '📚', '🧬', '💡'
];

console.log('1. Checking FluentEmoji emojis...');
for (const emoji of requiredEmojis) {
  const clean = emoji.replace(/\uFE0F/g, '');
  const hasEmoji = fluentEmojiSrc.includes(`'${emoji}'`) || fluentEmojiSrc.includes(`'${clean}'`);
  assert(hasEmoji, `Missing emoji case for ${emoji} (${clean}) in FluentEmoji.tsx`);
}
console.log('✔ All 16 required emojis present in FluentEmoji.tsx');

// 2. Check no hardcoded hex colors in AppShell and FluentEmoji
console.log('2. Checking for hardcoded hex colors...');
const appShellDir = path.resolve('src/components/AppShell');
const filesToCheck = [
  fluentEmojiPath,
  ...fs.readdirSync(appShellDir).map(f => path.join(appShellDir, f))
];

const hexRegex = /#[0-9a-fA-F]{3,8}/g;
let hexViolations = [];
for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(hexRegex);
  if (matches) {
    hexViolations.push({ file, matches });
  }
}
assert.strictEqual(hexViolations.length, 0, `Found hardcoded hex in: ${JSON.stringify(hexViolations)}`);
console.log('✔ Zero hardcoded hex colors in AppShell components and FluentEmoji');

// 3. Verify CurvedNotchNav SVG geometry
console.log('3. Checking CurvedNotchNav SVG geometry...');
const curvedNotchPath = path.resolve('src/components/AppShell/CurvedNotchNav.tsx');
const curvedNotchSrc = fs.readFileSync(curvedNotchPath, 'utf8');

assert(curvedNotchSrc.includes('d="M0 0 Q10 0 15 8 L25 8 Q30 0 40 0 Z"'), 'Curved notch path geometry mismatch');
assert(curvedNotchSrc.includes('fill="var(--off-white)"'), 'Curved notch fill should be var(--off-white)');
assert(curvedNotchSrc.includes('aria-hidden="true"'), 'Curved notch decorative SVG must have aria-hidden="true"');
console.log('✔ CurvedNotchNav SVG geometry verified');

// 4. Verify Accessibility: aria-labels and focus rings
console.log('4. Checking Accessibility (aria-labels and focus rings)...');
const floatingToolbarPath = path.resolve('src/components/AppShell/FloatingToolbar.tsx');
const floatingToolbarSrc = fs.readFileSync(floatingToolbarPath, 'utf8');

assert(floatingToolbarSrc.includes('aria-label="Quick Actions Floating Toolbar"'), 'FloatingToolbar nav missing aria-label');
const toolbarAriaLabels = [
  'View Roadmap',
  'Continue Current Lesson',
  'Take Practice Quiz',
  'View Mastery Progress',
  'Adaptive Course Changelog',
  'Create New Course'
];
for (const label of toolbarAriaLabels) {
  assert(floatingToolbarSrc.includes(`aria-label="${label}"`), `FloatingToolbar missing aria-label="${label}"`);
}
assert((floatingToolbarSrc.match(/focus-visible:ring-2/g) || []).length >= 6, 'FloatingToolbar buttons missing focus rings');
console.log('✔ FloatingToolbar accessibility verified');

const topBarPath = path.resolve('src/components/AppShell/TopBar.tsx');
const topBarSrc = fs.readFileSync(topBarPath, 'utf8');
assert(topBarSrc.includes('aria-label="AnyLearn Home"'), 'TopBar wordmark missing aria-label');
assert(topBarSrc.includes('focus-visible:ring-2'), 'TopBar wordmark missing focus ring');
console.log('✔ TopBar accessibility verified');

const avatarPath = path.resolve('src/components/AppShell/AvatarDropdown.tsx');
const avatarSrc = fs.readFileSync(avatarPath, 'utf8');
assert(avatarSrc.includes('aria-label="User profile and settings"'), 'Avatar button missing aria-label');
assert(avatarSrc.includes('aria-expanded={isOpen}'), 'Avatar button missing aria-expanded');
assert(avatarSrc.includes('aria-haspopup="true"'), 'Avatar button missing aria-haspopup');
assert(avatarSrc.includes('role="menu"'), 'Dropdown menu missing role="menu"');
assert(avatarSrc.includes('Escape'), 'Avatar dropdown missing Escape key handler');
console.log('✔ AvatarDropdown accessibility verified');

// 5. Verify Responsiveness tokens & layout
console.log('5. Checking Responsiveness tokens & classes...');
const appShellPath = path.resolve('src/components/AppShell/AppShell.tsx');
const appShellSrc = fs.readFileSync(appShellPath, 'utf8');
assert(appShellSrc.includes('rounded-[20px] md:rounded-[28px] lg:rounded-panel'), 'AppShell missing responsive border radius');

const secondaryPanelPath = path.resolve('src/components/AppShell/SecondaryPanel.tsx');
const secondaryPanelSrc = fs.readFileSync(secondaryPanelPath, 'utf8');
assert(secondaryPanelSrc.includes('hidden lg:flex'), 'SecondaryPanel must be hidden on mobile (<lg)');
console.log('✔ Responsiveness setup verified');

// 6. Verify Tailwind config tokens
console.log('6. Checking Tailwind configuration and CSS tokens...');
const tailwindConfigPath = path.resolve('tailwind.config.ts');
const tailwindSrc = fs.readFileSync(tailwindConfigPath, 'utf8');
const deiTokens = [
  "mint: '#CFF7D3'",
  "lavender: '#F1D3FA'",
  "butter: '#FBE8B0'",
  "sky: '#D5F1F7'",
  "pink: '#FF8FC7'",
  "black: '#0A0A0A'",
  "'off-white': '#F7F7F7'",
  "grey: '#F0F0F0'"
];
for (const token of deiTokens) {
  assert(tailwindSrc.includes(token), `tailwind.config.ts missing token ${token}`);
}

const globalsCssPath = path.resolve('src/app/globals.css');
const globalsCssSrc = fs.readFileSync(globalsCssPath, 'utf8');
assert(globalsCssSrc.includes('@import "tailwindcss";'), 'globals.css missing Tailwind v4 @import');
assert(globalsCssSrc.includes('@theme'), 'globals.css missing @theme directive');
assert(globalsCssSrc.includes('--mastery-untouched: #4b5563;'), 'globals.css missing --mastery-untouched');
assert(globalsCssSrc.includes('--mastery-weak: #f59e0b;'), 'globals.css missing --mastery-weak');
assert(globalsCssSrc.includes('--mastery-ok: #3b82f6;'), 'globals.css missing --mastery-ok');
assert(globalsCssSrc.includes('--mastery-solid: #22c55e;'), 'globals.css missing --mastery-solid');
console.log('✔ Tailwind configuration and globals.css verified');

// 7. Verify Assets
console.log('7. Checking SVG Assets...');
assert(fs.existsSync('public/assets/logo-mark.svg'), 'Missing logo-mark.svg');
assert(fs.existsSync('public/assets/empty-state.svg'), 'Missing empty-state.svg');
assert(fs.existsSync('public/assets/hero-collage.svg'), 'Missing hero-collage.svg');
console.log('✔ Assets verified');

console.log('=== ALL REVIEW CHECKS PASSED ===');
