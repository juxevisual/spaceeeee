---
name: spaceeeee
description: A private daily-use app for two partners — calm, clear, and honest.
colors:
  primary-500: "oklch(0.60 0.26 280)"
  primary-400: "oklch(0.68 0.225 280)"
  primary-50: "oklch(0.96 0.040 280)"
  gain: "oklch(0.64 0.19 150)"
  gain-light: "oklch(0.94 0.06 150)"
  loss: "oklch(0.58 0.21 18)"
  loss-light: "oklch(0.95 0.05 18)"
  surface-50: "oklch(0.985 0.002 280)"
  surface-100: "oklch(0.958 0.003 280)"
  surface-200: "oklch(0.918 0.003 280)"
  surface-400: "oklch(0.678 0.005 280)"
  surface-500: "oklch(0.518 0.005 280)"
  surface-700: "oklch(0.268 0.007 280)"
  surface-900: "oklch(0.108 0.009 280)"
  surface-950: "oklch(0.070 0.010 280)"
  notes-amber: "oklch(0.58 0.18 75)"
  dates-sky: "oklch(0.54 0.18 220)"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
    letterSpacing: "-0.03em"
    lineHeight: 1
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
    lineHeight: 1.2
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.07em"
  caption:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  full: "9999px"
  3xl: "1.75rem"
  2xl: "1.25rem"
  xl: "0.875rem"
  lg: "0.5rem"
  md: "0.375rem"
spacing:
  page-x: "16px"
  page-y: "24px"
  section: "32px"
  content: "20px"
  tight: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary-500}"
    textColor: "{colors.surface-50}"
    rounded: "{rounded.full}"
    padding: "8px 16px 8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-400}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.surface-500}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  button-danger-text:
    backgroundColor: "transparent"
    textColor: "{colors.loss}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  input-default:
    backgroundColor: "{colors.surface-50}"
    textColor: "{colors.surface-900}"
    rounded: "{rounded.xl}"
    padding: "8px 12px"
---

# Design System: spaceeeee

## 1. Overview

**Creative North Star: "The Evening Clarity Check"**

Two partners glancing at their finances on a phone at home after dinner. They want to know one thing fast: where do we stand? The interface answers without ceremony. No loading sequences to admire, no charts to explore for their own sake. Numbers surface. The eye lands. The phone goes back down.

This system is built on restraint. The surface is near-achromatic, tinted just enough with ghost indigo to feel intentional rather than defaulted. One accent color dominates each section of the app — electric indigo for financial data, signal green for the shared couple view, warm amber for notes, calm sky for dates. None of these compete. Each section has one color and uses it consistently across the button, the page label, and the nav active state.

The design explicitly rejects: SaaS hero-metric dashboards with decorative stat strips, crypto neon aesthetics, heavy page-load animation sequences, marketing gradients, and corporate fintech blue-and-white. It also rejects the softer traps: generic fintech minimalism with thin gray text everywhere, and the "calm app" aesthetic that substitutes beige for actual clarity.

**Key Characteristics:**
- Ghost-indigo surface tint (chroma 0.002–0.010) — barely visible in isolation, unmistakable as a system
- Double-bezel card architecture — outer shell + inner core with inset highlight
- Per-section identity colors applied to button, label, and nav active state consistently
- One type family throughout (Outfit), hierarchy through weight and size only
- Motion budget spent on feedback and entrance, never decoration

---

## 2. Colors: The Ghost Indigo Palette

Restrained strategy. One saturated accent per section, used on fewer than 10% of any screen. Everything else is near-achromatic with a ghost indigo tint that is invisible in isolation but creates unmistakable cohesion across the whole surface.

### Primary
- **Electric Indigo** (`oklch(0.60 0.26 280)`): Primary action buttons, nav active state for Portfolio and Expenses, focus rings, checklist checkbox fill. The one saturated color in the core financial surfaces. White text at 4.6:1 contrast.
- **Indigo 50** (`oklch(0.96 0.040 280)`): Active state background tints on pills and filter chips.

### Secondary (Semantic)
- **Signal Green** (`oklch(0.64 0.19 150)`): Portfolio gains, Together view identity (nav active state, dual-avatar, chart accents). Also used for Family expense tab active state.
- **Signal Green Light** (`oklch(0.94 0.06 150)`): Gain pill background in light mode.
- **Honest Red** (`oklch(0.58 0.21 18)`): Portfolio losses, error states, destructive action labels.
- **Honest Red Light** (`oklch(0.95 0.05 18)`): Loss pill background in light mode.

### Tertiary (Section Identity)
- **Warm Amber** (`oklch(0.58 0.18 75)`): Notes section identity — Add button, page label, Pinned label, TypeToggle active, checklist checkbox.
- **Calm Sky** (`oklch(0.54 0.18 220)`): Dates section identity — Add button, page label, countdown number, Today marker, "Today" chip.

### Neutral
- **Ghost Indigo Scale**: Near-achromatic surface colors, all tinted at hue 280 with chroma 0.002–0.010. `surface-50` (`oklch(0.985 0.002 280)`) is the page background in light mode. `surface-950` (`oklch(0.070 0.010 280)`) is OLED dark background. Text uses `surface-900` on light, `surface-100` on dark. Muted labels use `surface-400` on light, `surface-500` on dark. Disabled/secondary icons use `surface-500` on light.

### Named Rules
**The One Voice Rule.** Each section of the app has exactly one identity color. Portfolio and Expenses share electric indigo. Together uses signal green. Notes uses warm amber. Dates uses calm sky. These four colors never appear on each other's surfaces. Within a surface, the identity color appears on the Add button, the section header label, and the nav active state — nowhere else.

**The Ghost Rule.** No neutral in this system is pure gray. Every surface, every divider, every border is tinted toward hue 280 at chroma 0.002–0.010. This is invisible on a single element but makes the whole app feel unified.

---

## 3. Typography

**Display Font:** Outfit (300–800 weights loaded, Google Fonts)
**Body Font:** Outfit (same family — single-family system throughout)
**Label Font:** Outfit (uppercase with tracking for section labels)

**Character:** Outfit is geometric but warm, avoiding the clinical coldness of Inter or the stiffness of system-ui. It reads clearly at 11px uppercase and commands at 2.6rem bold. The single-family approach forces hierarchy through weight and size contrast alone — no serif/sans mixing as a crutch.

### Hierarchy
- **Display** (700, 2.6rem, tracking -0.03em, lh 1): Net worth number, MonthReview total. Largest data moment on any screen.
- **Headline** (700, 1.25rem, tracking -0.01em, lh 1.2): Stat card values (`text-xl font-bold`). Primary numbers in stat strips.
- **Title** (600–700, 0.875rem–1rem): Dialog headers, platform names in Portfolio, note content headings.
- **Body** (500, 0.875rem, lh 1.5): Note content, expense descriptions, form field text. Primary reading text.
- **Label** (600, 0.6875rem, uppercase, tracking 0.07em): Section headers ("NOTES", "HOLDINGS", "BY CATEGORY"). All uppercase. Never body text.
- **Caption** (600, 0.625rem, uppercase, tracking 0.08em): Sub-section dividers within cards ("PINNED", "RECENT", "ALL DONE!"). Even smaller, more tracking.

### Named Rules
**The No-Decoration Rule.** Hierarchy is achieved entirely through Outfit's weight range (300–800) and size steps. No italic, no underline (except links), no colored headings except for the section identity labels. If you need emphasis, increase weight or size.

---

## 4. Elevation

This system uses **tonal layering** rather than ambient shadows. Depth is conveyed through the double-bezel architecture and surface-level tints. Floating elements (navbar, popovers, sheets, toasts) use structural shadows to separate them from the page.

### Shadow Vocabulary
- **Page glass pill** (navbar, `shadow-[0_2px_16px_rgba(0,0,0,0.07),_0_1px_3px_rgba(0,0,0,0.04)]`): The outermost floating container. Barely perceptible on light backgrounds, clearly elevated on dark.
- **Double-bezel outer** (`ring-1 ring-black/[0.06] dark:ring-white/[0.15]`): Used on stat cards, platform sections, net worth panel. A hairline ring creates separation without shadow.
- **Double-bezel inner** (`shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`): The inset highlight on the inner core surface. Creates the sense of a recessed well in light mode. Inverted for dark mode (`rgba(255,255,255,0.12)`).
- **Holding card hover** (`shadow-[0_4px_16px_rgba(0,0,0,0.08)]`): Appears on hover only. State-driven shadow.
- **Popover/sheet** (`shadow-xl`, `shadow-[0_24px_80px_rgba(0,0,0,0.18)]`): Sheets (MonthReview, DateForm, NoteForm) use a large diffuse shadow to lift above the page surface.
- **Toast** (`shadow-lg`): Toasts are visually elevated above all content.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, float, elevation). A card that sits on the page uses ring-based separation, not shadow. Shadow means "this is floating above the normal surface."

---

## 5. Components

### Buttons

Buttons use rounded-full universally. The pill shape is the app's primary interactive affordance.

- **Primary:** Identity-color background, white text, `pl-4 pr-2 py-2` with a circular `+` icon badge. Shadow at `0_4px_16px_[color]/35` on hover. `active:scale-[0.97]`. Used as Add buttons across all pages.
- **Ghost / secondary:** `border border-surface-200`, `text-surface-600`, same radius. Used for Edit, Cancel, secondary actions.
- **Danger text:** `text-loss`, no border, no background. Used for Delete labels. Never a filled red button for standard deletes.
- **Nav pill:** Active = identity-color fill + white text + color-matched shadow. Inactive = `text-surface-500`, hover = `bg-black/5`.

### Cards / Containers

**Double-bezel architecture** is the signature card pattern:
- Outer: `p-1 rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.15] bg-black/[0.015] dark:bg-white/[0.04]`
- Inner: `rounded-[calc(1.25rem-0.25rem)] bg-surface-50 dark:bg-surface-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`
- Used on: stat cards, net worth panel, performance/allocation panel, coming-up strip cards.

**HoldingCard** uses a shallower double-bezel (`rounded-[0.875rem]`, `p-[3px]`).

**Note cards** break from double-bezel: simple `rounded-2xl ring-1 ring-black/[0.07]` with a colored background tint. Color is the primary container signal, not elevation.

### Inputs / Fields

- **Default:** `rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900`, `px-3 py-2 text-sm`. `[color-scheme:light] dark:[color-scheme:dark]` for native date inputs.
- **Focus:** `ring-2 ring-primary-500/40 border-primary-400`. The ring is 40% opacity indigo — clear but not aggressive.
- **Error state:** `border-loss` replaces the default border. Error message in `text-xs text-loss` below the field.
- **NumberInput:** `type="text"` with live dot-separated thousand formatting (Indonesian format: `1.250.000`). Cursor position preserved on format.

### Navigation

**Desktop pill:** Single floating container, `backdrop-blur-xl`, detached from edge with `pt-4`. Contains brand + all 5 nav items inline + actions.

**Mobile:** Two stacked pills. Top: brand + actions. Bottom: 3 main tabs (Portfolio, Expenses, Together) + More tab. More tab opens a popover with Notes and Dates. More tab label changes to "Notes" or "Dates" when on those routes.

**Active states:** Identity color fill on desktop (rounded-full pill). Identity color text on mobile tab (no fill). More tab uses the active sub-page's identity color.

### Toast

Bottom-center, auto-dismisses at 2.35 seconds. `bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900`. Spring enter/exit (18ms ease-out in, 15ms ease-in out).

**Undo toast:** 5-second duration. Underlined "Undo" text button inline. `pointer-events-auto` on the toast element. Clicking Undo dismisses immediately and re-inserts the deleted item.

### Signature Components

**Double-bezel stat card:** Section label (11px uppercase tracking) → large tabular number (font-bold tracking-[-0.01em]) → optional colored sub-label. Animates with `stat-value-in` fade on value change.

**MonthReview bottom sheet:** Slides up from bottom via `translate-y-full → translate-y-0`, spring physics. Scrollable inner body. Drag handle at top. Backdrop fades independently.

**Note card footer:** Author initial bubble (identity-colored per user: indigo for self, green for partner) + timestamp + reaction bar (read-only on own notes) + action icons.

---

## 6. Do's and Don'ts

### Do:
- **Do** use the identity color system consistently: one color per section, applied only to the Add button, page label, and nav active state.
- **Do** use `rounded-full` for all interactive buttons and nav pills. The pill shape is the primary affordance signal.
- **Do** use `text-surface-500` (minimum) for all icon buttons against colored backgrounds. Never `text-surface-300` which disappears on light note card colors.
- **Do** vary spacing between sections (not `space-y-5` everywhere). Tight cluster for related elements, generous gap between distinct sections.
- **Do** use OKLCH for all color values. Reduce chroma as lightness approaches extremes.
- **Do** use the double-bezel architecture for stat cards and financial data panels. The ring-based separation is the app's tactile signature.
- **Do** show undo toasts (5 seconds) instead of — or in addition to — confirmation dialogs for delete operations.

### Don't:
- **Don't** use SaaS hero-metric templates: big number + small label + decorative gradient accent strip. The net worth panel avoids this by leading with a status dot and a count of platforms, not a decorative background.
- **Don't** use crypto neon aesthetics, marketing gradients, or glassmorphism as decoration. The only blur in the app is on the navbar glass pill — purposeful, not decorative.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards or list items. Use full borders, background tints, or dot indicators instead.
- **Don't** use `background-clip: text` with a gradient. Emphasis through weight or size only.
- **Don't** use pure `#000` or `#fff`. Tint every neutral toward hue 280.
- **Don't** apply decorative infinite-loop animations. Motion budget is spent on entrance, state change, and feedback — nothing that loops without user action.
- **Don't** add a second font family. Outfit handles the full hierarchy through weight variation.
- **Don't** animate layout-driving properties (`width`, `height`, `top`, `left`, margin). Use `transform` and `opacity`. The expand/collapse pattern uses `grid-rows` with `overflow-hidden`.
- **Don't** use Robinhood-style green/red heavy theming where gain and loss colors dominate the surface. They appear only on gain/loss pills and velocity indicators — semantic, not decorative.
- **Don't** add new section identity colors without updating the nav system, Add button, and page label to match. The system works because all three are consistent.
