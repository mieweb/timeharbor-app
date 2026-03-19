# @mieweb/ui Migration Plan — Time Harbor App

> Comprehensive audit and execution plan for replacing all shadcn/ui components and raw HTML elements with `@mieweb/ui` equivalents, including brand theming and dark/light mode support.

---

## Current State Summary

| Attribute | Current Value |
|-----------|---------------|
| Framework | Next.js 16 (App Router) |
| React | 19.2.0 |
| CSS | Tailwind CSS 4.1.9 + `@tailwindcss/postcss` |
| PostCSS | Already correct (`@tailwindcss/postcss`) |
| Component library | **shadcn/ui** (57 wrapper files in `components/ui/`) |
| Theme system | `next-themes` (class-based, `.dark` only) |
| Icon library | Lucide React |
| Current `@mieweb/ui` usage | **0 imports** |

---

## Phase 1: Installation & CSS Foundation

### 1.1 Install `@mieweb/ui`

```bash
pnpm add @mieweb/ui
```

### 1.2 Update `app/globals.css`

Replace the existing CSS file with the `@mieweb/ui` theme system. Key changes:

1. Add `@source "../node_modules/@mieweb/ui/dist"` — tells Tailwind 4 to scan library classes
2. Add `@import '@mieweb/ui/brands/bluehive.css' layer(theme)` — load default brand
3. Change `@custom-variant dark` to use `data-theme` attribute: `(&:where([data-theme=dark], [data-theme=dark] *))`
4. Replace OKLCH color variables with `@mieweb/ui` CSS variable mappings (with hex fallbacks)
5. Keep sidebar-specific variables as app-local extensions

### 1.3 Update Theme Provider

The current `ThemeProvider` uses `next-themes` with `attribute="class"`. For `@mieweb/ui` compatibility, it must set **both** the `.dark` class AND `data-theme` attribute:

```tsx
<ThemeProvider attribute={["class", "data-theme"]} defaultTheme="dark" enableSystem disableTransitionOnChange>
```

`next-themes` supports an array for `attribute` — this sets both simultaneously.

### 1.4 Add Brand Switching Hook

Create `hooks/use-brand.ts` using `generateBrandCSS` and `brands` from `@mieweb/ui/brands`.

### 1.5 Packages to Remove After Migration

Once all shadcn wrappers are replaced, these Radix dependencies can be removed from `package.json`:

| Package | Replacement |
|---------|-------------|
| `@radix-ui/react-accordion` | `@mieweb/ui` Accordion (if used) |
| `@radix-ui/react-alert-dialog` | `@mieweb/ui` Modal |
| `@radix-ui/react-avatar` | `@mieweb/ui` Avatar |
| `@radix-ui/react-checkbox` | `@mieweb/ui` Checkbox |
| `@radix-ui/react-collapsible` | `@mieweb/ui` Collapsible (if available) |
| `@radix-ui/react-context-menu` | `@mieweb/ui` Dropdown |
| `@radix-ui/react-dialog` | `@mieweb/ui` Modal |
| `@radix-ui/react-dropdown-menu` | `@mieweb/ui` Dropdown |
| `@radix-ui/react-hover-card` | `@mieweb/ui` Tooltip |
| `@radix-ui/react-label` | `@mieweb/ui` Label (built into Input/Field) |
| `@radix-ui/react-menubar` | `@mieweb/ui` equivalent |
| `@radix-ui/react-navigation-menu` | `@mieweb/ui` Sidebar/Navigation |
| `@radix-ui/react-popover` | `@mieweb/ui` Popover |
| `@radix-ui/react-progress` | `@mieweb/ui` Progress |
| `@radix-ui/react-radio-group` | `@mieweb/ui` Radio |
| `@radix-ui/react-scroll-area` | `@mieweb/ui` ScrollArea (if available) |
| `@radix-ui/react-select` | `@mieweb/ui` Select |
| `@radix-ui/react-separator` | `@mieweb/ui` Separator (if available) |
| `@radix-ui/react-slider` | `@mieweb/ui` Slider |
| `@radix-ui/react-slot` | May still be needed for `asChild` patterns |
| `@radix-ui/react-switch` | `@mieweb/ui` Switch |
| `@radix-ui/react-tabs` | `@mieweb/ui` Tabs |
| `@radix-ui/react-toast` | `@mieweb/ui` Toast |
| `@radix-ui/react-toggle` | `@mieweb/ui` Toggle |
| `@radix-ui/react-toggle-group` | `@mieweb/ui` ToggleGroup |
| `@radix-ui/react-tooltip` | `@mieweb/ui` Tooltip |
| `class-variance-authority` | `@mieweb/ui` uses CVA internally |
| `clsx` | `@mieweb/ui` exports `cn` |
| `cmdk` | `@mieweb/ui` CommandPalette |
| `input-otp` | Keep or replace (check @mieweb/ui) |
| `react-day-picker` | `@mieweb/ui` DateRangePicker / DateInput |
| `sonner` | `@mieweb/ui` Toast |
| `tailwind-merge` | `@mieweb/ui` exports `cn` (which uses tailwind-merge) |
| `tailwindcss-animate` | `tw-animate-css` already covers this |
| `vaul` | `@mieweb/ui` Modal/Drawer |

---

## Phase 2: Component Audit — Full 1:1 Swap Map

### 2.1 shadcn/ui Wrapper Files → @mieweb/ui Direct Imports

All 57 files in `components/ui/` are shadcn wrappers around Radix primitives. Each will be replaced by importing directly from `@mieweb/ui`.

| # | shadcn File (`components/ui/`) | @mieweb/ui Replacement | Status |
|---|-------------------------------|------------------------|--------|
| 1 | `accordion.tsx` | `Accordion` from `@mieweb/ui` | ⬜ |
| 2 | `alert-dialog.tsx` | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` | ⬜ |
| 3 | `alert.tsx` | `Alert` | ⬜ |
| 4 | `aspect-ratio.tsx` | Keep or CSS-only | ⬜ |
| 5 | `avatar.tsx` | `Avatar` | ⬜ |
| 6 | `badge.tsx` | `Badge` | ⬜ |
| 7 | `breadcrumb.tsx` | `Breadcrumb` | ⬜ |
| 8 | `button-group.tsx` | Custom or `ButtonGroup` if available | ⬜ |
| 9 | `button.tsx` | `Button` | ⬜ |
| 10 | `calendar.tsx` | `DateInput` / `DateRangePicker` internal | ⬜ |
| 11 | `card.tsx` | `Card`, `CardHeader`, `CardContent` | ⬜ |
| 12 | `carousel.tsx` | Keep (no direct equivalent) or refactor | ⬜ |
| 13 | `chart.tsx` | Keep (recharts wrapper) — use `--mieweb-chart-*` vars | ⬜ |
| 14 | `checkbox.tsx` | `Checkbox` | ⬜ |
| 15 | `collapsible.tsx` | Evaluate availability | ⬜ |
| 16 | `command.tsx` | `CommandPalette` | ⬜ |
| 17 | `context-menu.tsx` | `Dropdown` | ⬜ |
| 18 | `dialog.tsx` | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` | ⬜ |
| 19 | `drawer.tsx` | `Modal` (drawer variant) or keep if no equivalent | ⬜ |
| 20 | `dropdown-menu.tsx` | `Dropdown` | ⬜ |
| 21 | `empty.tsx` | Custom (keep local, style with @mieweb/ui vars) | ⬜ |
| 22 | `field.tsx` | Built into `@mieweb/ui` form components | ⬜ |
| 23 | `form.tsx` | Evaluate (react-hook-form integration) | ⬜ |
| 24 | `hover-card.tsx` | `Tooltip` or keep | ⬜ |
| 25 | `input-group.tsx` | Built into `@mieweb/ui` Input patterns | ⬜ |
| 26 | `input-otp.tsx` | Evaluate availability | ⬜ |
| 27 | `input.tsx` | `Input` | ⬜ |
| 28 | `item.tsx` | Evaluate (likely custom) | ⬜ |
| 29 | `kbd.tsx` | Keep (simple, no equivalent needed) | ⬜ |
| 30 | `label.tsx` | `Label` (built into Field) | ⬜ |
| 31 | `menubar.tsx` | Evaluate availability | ⬜ |
| 32 | `navigation-menu.tsx` | `Sidebar` or app-level nav | ⬜ |
| 33 | `pagination.tsx` | `Pagination` | ⬜ |
| 34 | `popover.tsx` | `Popover` if available, or `Tooltip` | ⬜ |
| 35 | `progress.tsx` | `Progress` | ⬜ |
| 36 | `radio-group.tsx` | `Radio` | ⬜ |
| 37 | `resizable.tsx` | Keep (react-resizable-panels, no equivalent) | ⬜ |
| 38 | `scroll-area.tsx` | Evaluate availability | ⬜ |
| 39 | `select.tsx` | `Select` | ⬜ |
| 40 | `separator.tsx` | CSS utility or evaluate | ⬜ |
| 41 | `sheet.tsx` | `Modal` (slide-over variant) | ⬜ |
| 42 | `sidebar.tsx` | `Sidebar` | ⬜ |
| 43 | `skeleton.tsx` | `Skeleton` | ⬜ |
| 44 | `slider.tsx` | `Slider` | ⬜ |
| 45 | `sonner.tsx` | `Toast` | ⬜ |
| 46 | `spinner.tsx` | `Spinner` | ⬜ |
| 47 | `switch.tsx` | `Switch` | ⬜ |
| 48 | `table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` | ⬜ |
| 49 | `tabs.tsx` | `Tabs` | ⬜ |
| 50 | `textarea.tsx` | `Textarea` | ⬜ |
| 51 | `toast.tsx` | `Toast` | ⬜ |
| 52 | `toaster.tsx` | `Toast` system | ⬜ |
| 53 | `toggle-group.tsx` | Evaluate | ⬜ |
| 54 | `toggle.tsx` | Evaluate | ⬜ |
| 55 | `tooltip.tsx` | `Tooltip` | ⬜ |
| 56 | `use-mobile.tsx` | Keep (custom hook, not a component) | ⬜ |
| 57 | `use-toast.ts` | Replace with `@mieweb/ui` Toast API | ⬜ |

### 2.2 Raw HTML Elements in App Code (Outside `components/ui/`)

These are raw `<button>` elements found in feature code that must be replaced:

| # | File | Line | Element | Current Usage | Replacement |
|---|------|------|---------|---------------|-------------|
| 1 | `components/tickets/ticket-card.tsx` | 142 | `<button>` | Notes indicator (icon + count) | `Button` variant="ghost" |
| 2 | `components/layout/footer-nav.tsx` | 82 | `<button>` | Clock in/out circular button | `Button` with custom className |
| 3 | `components/layout/header-clock-status.tsx` | 72 | `<button>` | Team selector button | `Button` variant="ghost" |
| 4 | `components/layout/header-clock-status.tsx` | 86 | `<button>` | Sync indicator button | `Button` variant="ghost" |
| 5 | `components/team/team-switcher-modal.tsx` | 69 | `<button>` | Team selection row item | `Button` variant="outline" |
| 6 | `components/ui-utils/toast-container.tsx` | 36 | `<button>` | Toast dismiss button | `Button` variant="ghost" |

### 2.3 Custom Badge/Pill Patterns (Inline Styled Spans)

These styled `<span>` elements act as badges and should use `Badge` from `@mieweb/ui`:

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| 1 | `components/tickets/ticket-card.tsx` | ~139 | Status badge (`<span>` with `statusColors` map) |
| 2 | `components/team/team-switcher-modal.tsx` | ~82 | "Clocked In" indicator badge |
| 3 | `components/team/team-switcher-modal.tsx` | ~93 | Role badge (Owner/Member) |
| 4 | `app/account/page.tsx` | ~134 | Role badge (Owner/Member) |
| 5 | `components/layout/header-clock-status.tsx` | ~104 | Pending sync count badge |

### 2.4 Custom Card Patterns (Styled Divs)

These `<div>` containers use card-like styling and should use `Card`/`CardContent`:

| # | File | Description |
|---|------|-------------|
| 1 | `app/account/page.tsx` | Profile card (`rounded-xl border border-border bg-card p-6`) |
| 2 | `app/account/page.tsx` | Team list items (`rounded-xl border border-border bg-card p-4`) |
| 3 | `app/account/page.tsx` | Sync status card (`rounded-xl border border-border bg-card p-4`) |
| 4 | `app/account/page.tsx` | Activity history card |
| 5 | `components/tickets/ticket-card.tsx` | Ticket card wrapper (`rounded-xl border bg-card p-3`) |
| 6 | `components/team/team-switcher-modal.tsx` | Warning banner (`rounded-lg border border-warning/30 bg-warning/10 p-3`) |

### 2.5 Custom Toast System

The app has a **custom toast** implementation (not using the shadcn toast):

| File | Description |
|------|-------------|
| `components/ui-utils/toast-container.tsx` | Custom toast renderer (positioned div with manual styling) |
| `lib/store/` | Zustand store with `addToast`/`removeToast` |

**Replace with:** `@mieweb/ui` Toast system. This requires updating the store's toast dispatch to use `@mieweb/ui`'s toast API.

### 2.6 Feature Components Import Map

Which `@/components/ui/*` imports each feature file uses (these imports will change to `@mieweb/ui`):

| Feature File | shadcn Imports Used |
|-------------|---------------------|
| `app/account/page.tsx` | Avatar, AvatarFallback, AvatarImage, Button, ScrollArea |
| `app/team/[teamId]/dashboard/page.tsx` | Button |
| `app/team/[teamId]/members/page.tsx` | (none directly — uses MemberCard, AssignmentPanel) |
| `app/team/[teamId]/tickets/page.tsx` | Button, Tabs, TabsContent, TabsList, TabsTrigger |
| `components/layout/clock-in-prompt-modal.tsx` | Button, Dialog (DialogContent, DialogHeader, etc.) |
| `components/layout/header-clock-status.tsx` | Button |
| `components/layout/footer-nav.tsx` | (none — uses raw `<button>`) |
| `components/tickets/add-ticket-modal.tsx` | Button, Input, Label, Textarea, Dialog, Select |
| `components/tickets/empty-tickets-state.tsx` | Button |
| `components/tickets/stop-timer-modal.tsx` | Dialog, Button, Textarea |
| `components/tickets/ticket-card.tsx` | Button, DropdownMenu |
| `components/tickets/ticket-notes-modal.tsx` | Dialog, Button, Textarea, ScrollArea |
| `components/team/member-card.tsx` | Avatar, AvatarFallback, AvatarImage |
| `components/team/assignment-panel.tsx` | Button, Select |
| `components/team/team-switcher-modal.tsx` | Dialog |
| `components/ui-utils/confirm-dialog.tsx` | Button, Dialog |
| `components/ui-utils/toast-container.tsx` | (none — all raw HTML) |
| `components/activity/activity-log.tsx` | (none — all raw HTML divs) |

---

## Phase 3: Execution Plan

### Step 0: Pre-Flight
- [ ] Create a feature branch: `git checkout -b feature/mieweb-ui-migration`
- [ ] Install: `pnpm add @mieweb/ui`
- [ ] Verify `@mieweb/ui` exports available: `node -e "require('@mieweb/ui')"`

### Step 1: CSS Foundation (MUST be done first)
- [ ] Update `app/globals.css` with `@mieweb/ui` theme variables, `@source` directive, brand import
- [ ] Update `@custom-variant dark` to use `data-theme` attribute
- [ ] Add hex fallbacks to all CSS variable mappings per `tailwind4-integration.md`
- [ ] Update `ThemeProvider` to set both `class` and `data-theme` attributes
- [ ] Verify light/dark mode toggle still works

### Step 2: Create Brand Switching Infrastructure
- [ ] Create `hooks/use-brand.ts` with `useBrand` hook
- [ ] Wire brand switching into `ThemeProvider` or app layout
- [ ] Verify at least 2 brands work (bluehive + one other)

### Step 3: Replace Core UI Components (High Impact)

**3a. Button** — Most commonly used component (used in 12+ files)
- [ ] Verify `Button` from `@mieweb/ui` supports: `variant` (default, destructive, ghost, outline), `size` (sm, default, lg), `disabled`, `asChild`, `className`
- [ ] Update all 12+ files importing `@/components/ui/button` → `@mieweb/ui`
- [ ] Replace 6 raw `<button>` elements with `Button` from `@mieweb/ui`
- [ ] Delete `components/ui/button.tsx`

**3b. Dialog/Modal** — Used for all modals (5 modal components)
- [ ] Map shadcn Dialog API → `@mieweb/ui` Modal API:
  - `Dialog` → `Modal`
  - `DialogContent` → `ModalBody` (or Modal wrapper)
  - `DialogHeader` → `ModalHeader`
  - `DialogTitle` → title prop or `ModalHeader` child
  - `DialogDescription` → `ModalBody` content
  - `DialogFooter` → `ModalFooter`
- [ ] Update: `clock-in-prompt-modal.tsx`, `add-ticket-modal.tsx`, `stop-timer-modal.tsx`, `ticket-notes-modal.tsx`, `team-switcher-modal.tsx`, `confirm-dialog.tsx`
- [ ] Delete `components/ui/dialog.tsx`, `components/ui/alert-dialog.tsx`, `components/ui/sheet.tsx`, `components/ui/drawer.tsx`

**3c. Input** — Used in add-ticket-modal
- [ ] Replace `@/components/ui/input` → `Input` from `@mieweb/ui`
- [ ] Delete `components/ui/input.tsx`

**3d. Textarea** — Used in 3 modal components
- [ ] Replace `@/components/ui/textarea` → `Textarea` from `@mieweb/ui`
- [ ] Delete `components/ui/textarea.tsx`

**3e. Select** — Used in add-ticket-modal, assignment-panel
- [ ] Map Select/SelectContent/SelectItem/SelectTrigger/SelectValue → `@mieweb/ui` Select API
- [ ] Delete `components/ui/select.tsx`

**3f. Avatar** — Used in account page, member-card
- [ ] Replace Avatar/AvatarFallback/AvatarImage → `Avatar` from `@mieweb/ui`
- [ ] Delete `components/ui/avatar.tsx`

**3g. Tabs** — Used in tickets page
- [ ] Replace Tabs/TabsContent/TabsList/TabsTrigger → `Tabs` from `@mieweb/ui`
- [ ] Delete `components/ui/tabs.tsx`

**3h. Badge** — Replace all custom badge/pill spans
- [ ] Replace 5 inline badge patterns with `Badge` from `@mieweb/ui`
- [ ] Delete `components/ui/badge.tsx`

**3i. Card** — Replace all custom card divs
- [ ] Replace 6+ card patterns in account page, ticket-card, etc. with `Card`/`CardContent`
- [ ] Delete `components/ui/card.tsx`

**3j. DropdownMenu** — Used in ticket-card
- [ ] Replace DropdownMenu → `Dropdown` from `@mieweb/ui`
- [ ] Delete `components/ui/dropdown-menu.tsx`

**3k. ScrollArea** — Used in account page, ticket-notes-modal
- [ ] Evaluate `@mieweb/ui` ScrollArea availability, replace or use native CSS `overflow-auto`
- [ ] Delete `components/ui/scroll-area.tsx`

**3l. Label** — Used in add-ticket-modal
- [ ] Replace → `Label` from `@mieweb/ui` or rely on built-in form field labels
- [ ] Delete `components/ui/label.tsx`

### Step 4: Replace Feedback Components

**4a. Toast System**
- [ ] Replace custom `ToastContainer` with `@mieweb/ui` Toast system
- [ ] Update Zustand store toast actions to use `@mieweb/ui` toast API
- [ ] Delete `components/ui/toast.tsx`, `components/ui/toaster.tsx`, `components/ui/use-toast.ts`
- [ ] Delete `components/ui-utils/toast-container.tsx`

**4b. Spinner**
- [ ] Replace `@/components/ui/spinner` → `Spinner` from `@mieweb/ui`
- [ ] Delete `components/ui/spinner.tsx`

**4c. Skeleton**
- [ ] Replace `@/components/ui/skeleton` → `Skeleton` from `@mieweb/ui`
- [ ] Delete `components/ui/skeleton.tsx`

**4d. Progress**
- [ ] Replace `@/components/ui/progress` → `Progress` from `@mieweb/ui`
- [ ] Delete `components/ui/progress.tsx`

**4e. Alert**
- [ ] Replace `@/components/ui/alert` → `Alert` from `@mieweb/ui`
- [ ] Delete `components/ui/alert.tsx`

### Step 5: Replace Navigation Components

**5a. Sidebar**
- [ ] Replace `@/components/ui/sidebar` → `Sidebar` from `@mieweb/ui`
- [ ] Delete `components/ui/sidebar.tsx`

**5b. Breadcrumb**
- [ ] Replace → `Breadcrumb` from `@mieweb/ui`
- [ ] Delete `components/ui/breadcrumb.tsx`

**5c. Pagination**
- [ ] Replace → `Pagination` from `@mieweb/ui`
- [ ] Delete `components/ui/pagination.tsx`

### Step 6: Replace Remaining Form Components

- [ ] Checkbox → `Checkbox` from `@mieweb/ui`
- [ ] Radio → `Radio` from `@mieweb/ui`
- [ ] Switch → `Switch` from `@mieweb/ui`
- [ ] Slider → `Slider` from `@mieweb/ui`
- [ ] Delete corresponding `components/ui/` files

### Step 7: Replace Overlay Components

- [ ] Tooltip → `Tooltip` from `@mieweb/ui`
- [ ] Popover → evaluate `@mieweb/ui` equivalent
- [ ] Delete corresponding `components/ui/` files

### Step 8: Evaluate & Keep or Replace Remaining Components

These need individual evaluation against `@mieweb/ui` availability:

| Component | Decision |
|-----------|----------|
| `accordion.tsx` | Replace if `@mieweb/ui` has Accordion |
| `aspect-ratio.tsx` | Keep (CSS utility) |
| `button-group.tsx` | Keep or replace |
| `calendar.tsx` | Replace with `@mieweb/ui` DateInput internals |
| `carousel.tsx` | Keep (embla-carousel, no equivalent) |
| `chart.tsx` | Keep (recharts wrapper) — update CSS vars to `--mieweb-chart-*` |
| `collapsible.tsx` | Evaluate |
| `command.tsx` | Replace with `CommandPalette` from `@mieweb/ui` |
| `context-menu.tsx` | Replace with `Dropdown` |
| `empty.tsx` | Keep (app-specific empty state) |
| `field.tsx` | Replace with `@mieweb/ui` form patterns |
| `form.tsx` | Keep (react-hook-form integration layer) |
| `hover-card.tsx` | Replace with `Tooltip` |
| `input-group.tsx` | Evaluate |
| `input-otp.tsx` | Keep (no equivalent) |
| `item.tsx` | Evaluate |
| `kbd.tsx` | Keep (simple) |
| `menubar.tsx` | Evaluate |
| `navigation-menu.tsx` | Evaluate |
| `resizable.tsx` | Keep (react-resizable-panels) |
| `separator.tsx` | Keep or CSS `<hr>` |
| `sonner.tsx` | Delete (replaced by @mieweb/ui Toast) |
| `toggle.tsx` | Evaluate |
| `toggle-group.tsx` | Evaluate |
| `use-mobile.tsx` | Keep (custom hook) |

### Step 9: Clean Up Utility Files

- [ ] Update `lib/utils.ts` — replace local `cn` with `import { cn } from '@mieweb/ui'`
- [ ] Remove `clsx` and `tailwind-merge` from `package.json` if no longer used directly
- [ ] Remove unused Radix packages from `package.json`
- [ ] Remove `class-variance-authority` if not used directly

### Step 10: Activity Log Component

`components/activity/activity-log.tsx` uses only raw divs and spans — no shadcn imports. It needs:
- [ ] Replace card-like divs with `Card`/`CardContent`
- [ ] Replace badge-like spans with `Badge`
- [ ] Consider using `Timeline` from `@mieweb/ui` if the layout matches

### Step 11: Loading Skeleton Component

`components/ui-utils/loading-skeleton.tsx` is a local skeleton component:
- [ ] Replace with `Skeleton` from `@mieweb/ui`
- [ ] Update `components/ui-utils/loading-skeleton.tsx` imports

---

## Phase 4: Testing & Verification

### Visual Smoke Tests (after each step)
- [ ] Light mode: All components visible, correct colors, no transparent gaps
- [ ] Dark mode: Toggle → all surfaces invert. No white flashes
- [ ] Brand switch: Primary color changes on buttons, focus rings, links
- [ ] Dark + non-default brand: Both working simultaneously
- [ ] Responsive: Mobile-first layout still works (this is a mobile-first app)
- [ ] Keyboard navigation: Tab through page, focus indicators visible

### Functional Tests
- [ ] Clock in/out button works in footer nav
- [ ] Team switching modal works
- [ ] Ticket timer start/stop works
- [ ] Add ticket modal form submits
- [ ] Stop timer modal with notes works
- [ ] Ticket notes modal works
- [ ] Confirm dialog works
- [ ] Toast notifications appear and dismiss
- [ ] Activity log displays correctly
- [ ] Account page displays all sections
- [ ] Run existing Playwright tests: `pnpm test`

### Build Verification
- [ ] `npx tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] No console errors in browser

---

## Phase 5: Gap Detection

After completing all replacements, scan for:

### Components with No @mieweb/ui Equivalent
```bash
# Custom components that may need to stay local
grep -rn 'export.*function\|export.*const' --include='*.tsx' components/ \
  | grep -v '@mieweb/ui' \
  | grep -v 'node_modules' \
  | grep -v 'components/ui/'
```

### CSS Variables Not in @mieweb/ui
```bash
# App-specific variables (sidebar-* are expected to stay local)
grep -rn 'var(--' --include='*.css' --include='*.tsx' app/ components/ \
  | grep -v 'mieweb' \
  | grep -v 'node_modules'
```

### Missing ARIA Labels
```bash
grep -rn '<Button\|<Input\|<Select\|<Modal' --include='*.tsx' components/ app/ \
  | grep -v 'aria-' \
  | grep -v 'label'
```

---

## Execution Order Summary

| Order | Task | Files Affected | Estimated Scope |
|-------|------|---------------|-----------------|
| 0 | Branch + install | `package.json` | 1 file |
| 1 | CSS foundation | `app/globals.css`, `components/theme-provider.tsx` | 2 files |
| 2 | Brand hook | `hooks/use-brand.ts` (new) | 1 file |
| 3a | Button | 12+ files + delete 1 ui file | ~13 files |
| 3b | Dialog/Modal | 6 modal files + delete 4 ui files | ~10 files |
| 3c | Input | 1 file + delete 1 ui file | 2 files |
| 3d | Textarea | 3 files + delete 1 ui file | 4 files |
| 3e | Select | 2 files + delete 1 ui file | 3 files |
| 3f | Avatar | 2 files + delete 1 ui file | 3 files |
| 3g | Tabs | 1 file + delete 1 ui file | 2 files |
| 3h | Badge (inline spans) | 5 files + delete 1 ui file | 6 files |
| 3i | Card (inline divs) | 3 files + delete 1 ui file | 4 files |
| 3j | DropdownMenu | 1 file + delete 1 ui file | 2 files |
| 3k | ScrollArea | 2 files + delete 1 ui file | 3 files |
| 3l | Label | 1 file + delete 1 ui file | 2 files |
| 4 | Feedback (Toast, Spinner, Skeleton, Progress, Alert) | ~8 files | 8 files |
| 5 | Navigation (Sidebar, Breadcrumb, Pagination) | ~3 files | 3 files |
| 6 | Forms (Checkbox, Radio, Switch, Slider) | ~4 files | 4 files |
| 7 | Overlays (Tooltip, Popover) | ~2 files | 2 files |
| 8 | Evaluate & keep/replace remaining | ~15 files | 15 files |
| 9 | Clean up utils + packages | `lib/utils.ts`, `package.json` | 2 files |
| 10 | Activity log | 1 file | 1 file |
| 11 | Loading skeleton | 1 file | 1 file |
| 12 | Testing + verification | All | - |

---

## Notes

- **Lucide React** icons: These are framework-agnostic and stay. `@mieweb/ui` doesn't replace icons.
- **Zustand store**: State management is unaffected. Only the UI rendering layer changes.
- **Next.js App Router**: No routing changes needed. Only component imports change.
- **`next-themes`**: Can be kept for the dark mode toggle mechanism, but must be configured to set `data-theme` attribute in addition to class.
- **`react-hook-form`**: The form integration layer may need adjustment if `@mieweb/ui` form components have different ref/value patterns.
- **`recharts`**: Stays as-is. Just ensure chart colors use `--mieweb-chart-*` CSS variables.
