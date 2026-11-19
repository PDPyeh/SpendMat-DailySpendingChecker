# DESIGN.md: SpendMat (Daily Spending Desk)

## Product Identity
- **Name:** SpendMat (Daily Spending Desk)
- **Kind:** Windows desktop application (Electron) for tracking daily spending with automatic nightly missed-entry reminders.
- **Audience:** Individual desktop user who wants a fast, tactile daily expense log and a reliable night alert when they forget to record the day.

## Visual Direction (Derived from User Reference Image)
- **Design Read:** Personal daily spending desktop app for an individual user, in a tactile blue cutting-mat and torn-notebook creative-media collage style derived from the user's reference image, dial ENERGY 3 / RHYTHM 3 / MOTION 2.
- **Dials:**
  - `ENERGY: 3` (Bold tactile craft desk identity with bright cobalt mat, torn notebook paper, binder clip fasteners, and chunky sticker-cut headings)
  - `RHYTHM: 3` (Asymmetric desktop collage composition: wide torn-edge ledger sheet paired with a pinned yellow Night Watch clipboard and a tilted 7-day paper tape note, contrasting with index-card archive sheets)
  - `MOTION: 2` (Purposeful tactile transitions: paper tab swaps, clip press feedback, modal slide-in, and new-row ink highlight; zero endless loops)

## Color Palette (Capped to 3 Core + 1 Accent + Neutrals)
- **Core 1 (Cutting Mat Cobalt):** `#126CE2` (mat ground), `#0B52B5` (deep ink/border), `#0C3F8C` (high-contrast blue ink on paper, >= 8.5:1 contrast)
- **Core 2 (Warm Desk Wood):** `#754D32` (top/bottom wood frame), `#543520` (dark wood rim)
- **Core 3 (Stationery Sun Yellow):** `#F5C122` (clipboard body, folder tabs, focus indicator halo, ruler prop)
- **Deliberate Accent (Binder-Clip Magenta):** `#D81B7E` (binder clips, overdue/unlogged night warning pin, destructive confirm action; paired with `#FFFFFF` >= 4.7:1 contrast)
- **Neutrals (Day Desk):** `#FAF8F3` (torn notebook paper), `#F0ECE2` (ruled/secondary paper), `#18212F` (primary charcoal ink, >13:1 on paper), `#4B5565` (secondary muted ink, >6.5:1 on paper)
- **Night Desk Theme (for late-night 21:00 logging):** `#0B2242` (night cutting mat), `#1A2434` (dimly-lit ledger sheet), `#F3F5F8` (primary light ink, >13:1), `#B6C2D4` (secondary ink, >8:1), `#F5C122` (yellow clipboard dark-adapted header), `#F0449E` (accent magenta on dark >= 5.2:1)

## Typography
- **Display Headings:** `Silkscreen` (bundled locally via `@fontsource/silkscreen`) in cobalt blue with crisp sticker white outline and offset drop shadow, matching the chunky pixel-cut display headings in the reference image.
- **UI Body & Forms:** `Plus Jakarta Sans` (bundled locally via `@fontsource/plus-jakarta-sans`) for warm, readable notebook entries and controls.
- **Numeric Amounts:** `IBM Plex Mono` (`font-variant-numeric: tabular-nums`, bundled locally via `@fontsource/ibm-plex-mono`) restricted to currency totals and ledger amounts so digits align vertically down the page.

## Purpose Log (R-31 & Group 2 Purpose-Gate)
- **Cutting-mat grid (R-07):** Reproduces the cobalt blueprint cutting mat from the user's reference image; establishes the desk surface underneath the paper sheets.
- **Torn paper edges & spiral punch holes (Identity Motif):** Distinguishes editable ledger sheets from desk background and pinned notes.
- **Pink binder clip (R-01, R-12):** Acts as the physical anchor and focal accent at the top of the primary ledger sheet.
- **Selective elevation shadows (R-12):** Crisp offset paper shadows (`4px 6px 0` / soft drop) separate pinned paper layers from the flat cutting mat without floating every inner input.
- **Zero glassmorphism overuse (R-10):** Solid matte paper and cardstock surfaces throughout; only the bottom wooden desk status strip uses subtle translucent depth.
- **Zero decorative emojis or Lucide clone icons (R-04):** Custom chunky 2px geometric stationery SVG icons paired strictly with functional controls.
- **One chart with one question:** 7-day spending bar note titled "Daily spending, last 7 days" so the user can spot high-spend or missed days at a glance and click any bar to inspect that day.
