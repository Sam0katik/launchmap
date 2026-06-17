# LaunchMap — Design tokens (Linear-derived)

Derived from Linear's `DESIGN.md` (awesome-design-md collection). Near-black
product canvas, a single lavender-blue accent used scarcely, dense type with
aggressive negative tracking. Implemented in `tailwind.config.ts` +
`app/globals.css`.

## Colors

| Token | Hex | Use |
|-------|-----|-----|
| `canvas` | `#010102` | Page background (near-black, faint blue tint — not pure #000) |
| `surface-1` | `#0f1011` | Cards, panels, inputs |
| `surface-2` | `#141516` | Hovered/featured cards, badges |
| `surface-3` | `#18191a` | Sub-nav, dropdowns |
| `primary` | `#5e6ad2` | Lavender accent — brand mark, primary CTA, focus ring ONLY |
| `primary-hover` | `#828fff` | CTA hover |
| `primary-focus` | `#5e69d1` | Focus ring tint (2px @ 50% opacity) |
| `ink` | `#f7f8f8` | Headlines + emphasized body |
| `ink-muted` | `#d0d6e0` | Secondary text |
| `ink-subtle` | `#8a8f98` | Tertiary text, deselected states |
| `ink-tertiary` | `#62666d` | Disabled, footnotes |
| `hairline` | `#23252a` | 1px card borders + dividers |
| `success` | `#27a644` | The only semantic color |

## Type

- **Font:** Inter (free substitute for Linear's proprietary cut) — weights 400/500/600/700.
- **Display** (`display-xl`, `display-lg`): weight 600, negative tracking (-0.03em → -0.025em).
- **Body:** 16px / 1.5 / weight 400.
- **Eyebrow:** 13px, weight 500, +0.4px tracking, uppercase, `ink-subtle`.

## Shape & space

- Radius: buttons/inputs `8px` (`md`), cards `12px` (`lg`), screenshot panels `16px` (`xl`).
- Spacing base unit 4px: `xs` 8 · `sm` 12 · `md` 16 · `lg` 24 · `xl` 32 · `section` 96.
- Card padding: 24px.

## Rules (from Linear's do/don't)

- ✅ Lavender ONLY on brand mark, primary CTA, focus, link emphasis.
- ✅ Hierarchy via the surface ladder (canvas → surface-1 → 2 → 3), not shadows.
- ✅ Pair display weight 600 with body weight 400.
- ❌ No light mode. No second chromatic accent. No atmospheric gradients.
- ❌ Don't pill-round CTAs. Don't use pure `#000` canvas.
