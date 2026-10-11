# Spacing & visual hierarchy

This patch complements `docs/TYPE-SCALE.md`. All typography **sizes** remain on the established six-step scale in `assets/css/type-scale.css`.

## Spacing tokens

| Token | Value | Intended use |
|---|---:|---|
| `--space-1` | 4px | small inline breathing room |
| `--space-2` | 8px | tight label/meta gap |
| `--space-3` | 12px | compact element spacing |
| `--space-4` | 16px | standard element padding |
| `--space-5` | 24px | related groups |
| `--space-6` | 32px | major groups / mobile sections |
| `--space-7` | 48px | editorial section intervals |
| `--space-8` | 64px | intentionally large editorial rests |

Use semantic tokens for repeatable layout spacing:
- `--flow-detail` (8px), `--flow-item` (16px desktop / 12px mobile),
  `--flow-group` (24px desktop / 16px mobile), and
  `--flow-section` (48px desktop / 32px mobile).
- Do not normalize bespoke diagram/illustration positions, archive chrome, or
  timeline geometry to the spacing scale.

## Tonal hierarchy

`--tone-display` > `--tone-heading` > `--tone-body` > `--tone-secondary` >
`--tone-meta`; `--tone-label` is for terse section/field labels.
The `--rule-soft`/`--rule-standard` pair is for editorial dividers.
These use the site's original cool navy/gray palette; avoid using opacity on
text carrying meaningful bibliographic or contact information.

## Coverage

- `assets/css/site-shell.css`: shell, nav, footer
- `src/pages/home.html`: principal editorial spacing, no changes to the
  deliberately low-opacity research graphic
- `src/pages/profile.html` and `src/templates/publications-index.html`:
  section rhythm and text levels
- `src/styles/pages/research.css`, `contact.css`, `archive.css`:
  layout rhythm and support text where appropriate

Other highly bespoke layouts (figures, visual timelines, publication detail
cards, and the archive illustration) keep their individual measurements.
Changing the tokens updates the coordinated editorial framework while
preserving custom research presentation.
