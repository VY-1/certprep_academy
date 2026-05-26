# Design Brief

## Direction

Certification Exam Platform — A professional, distraction-free assessment environment designed for focused study and high-stakes testing.

## Tone

Dark Editorial with Professional Confidence. Clean, calm, trustworthy—the visual priority is clarity and speed, not decoration.

## Differentiation

Exam timer with smooth progress visualization and color-coded feedback (green success, red errors) reduces cognitive load during critical thinking.

## Color Palette

| Token      | OKLCH             | Role                            |
| ---------- | ----------------- | ------------------------------- |
| background | 0.12 0.008 260    | Deep charcoal, minimizes fatigue |
| foreground | 0.95 0.008 260    | Clean white for high contrast    |
| card       | 0.16 0.01 260     | Elevated surface for content     |
| primary    | 0.62 0.16 220     | Professional blue, CTAs & focus  |
| accent     | 0.65 0.18 140     | Success green, correct answers   |
| destructive| 0.55 0.22 25      | Coral red, errors & warnings     |
| muted      | 0.22 0.01 260     | Tertiary surfaces, labels        |

## Typography

- Display: Space Grotesk — modern, geometric, confident headings and question numbers
- Body: General Sans — professional, legible body text and UI labels
- Scale: Question titles `text-lg font-semibold`, labels `text-sm font-medium`, body `text-base`

## Elevation & Depth

Subtle layering via card surfaces (0.16L) on background (0.12L). Minimal shadows (0.08–0.12 opacity blur) create soft depth without visual noise.

## Structural Zones

| Zone    | Background      | Border          | Notes                             |
| ------- | --------------- | --------------- | --------------------------------- |
| Header  | card (0.16L)    | border subtle   | Timer, question count, navigation |
| Content | background      | —               | Question card + options section   |
| Feedback| card (0.16L)    | accent / destructive | Immediate result with explanation |

## Spacing & Rhythm

Generous padding (16px–24px) between sections creates visual breathing room. Tight question/option grouping (8px–12px) reduces cognitive distance. Exam timer positioned top-right with 12px inset.

## Component Patterns

- Buttons: `bg-primary text-primary-foreground`, pill-shaped (full roundness for submit), hover darkens via opacity
- Cards: `bg-card`, 6px radius, soft shadow-card, no border on content sections
- Radio Options: `border border-border bg-transparent`, 4px radius, blue ring on selection
- Badge: `text-xs font-semibold uppercase tracking-wide`, background muted

## Motion

- Entrance: Cards fade in on page load (200ms ease-out)
- Hover: Radio options brighten 4% opacity, buttons darken 6% opacity (200ms smooth transition)
- Feedback: Success/error states slide up with 250ms entrance, 500ms hold, 200ms exit

## Constraints

- No gradients, no blur effects, no parallax — focus on content clarity
- Radii: sharp answers (4px), cards (6px) — never full roundness except buttons
- Shadows: only shadow-card (8px blur, 0.08 opacity) and shadow-elevated (12px blur, 0.12 opacity)
- Typography: 2 fonts maximum (Space Grotesk display, General Sans body)

## Signature Detail

Exam timer in header with smooth countdown animation + progress bar showing question 45/90 — real-time visual anchor for time/progress without breaking focus on the question itself.
