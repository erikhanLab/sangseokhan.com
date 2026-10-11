# Six-step typography system

The entire site uses six font-size roles, from a single file:
`assets/css/type-scale.css`.

| Role | CSS variable | Desktop | Mobile (≤640px) | Use |
| --- | --- | ---: | ---: | --- |
| 1 Caption | `--type-caption` | 12px | 12px | labels, dates, notes, footers |
| 2 Small | `--type-small` | 14px | 14px | bibliographic details, captions, navigation on mobile |
| 3 Body | `--type-body` | 16px | 16px | main text and article titles |
| 4 Lead | `--type-lead` | 20px | 18px | section-level emphasis and introductory text |
| 5 Heading | `--type-heading` | 32px | 28px | masthead / standalone article heading |
| 6 Display | `--type-display` | 56px | 38px | home page personal name |

## Maintenance

- Alter sizes **only** in `assets/css/type-scale.css`.
- Every authored `font-size` declaration should refer to one of these tokens, or
  `inherit` where a child intentionally uses its parent's role.
- `font-size: 0` is deliberately retained for a text-replacement accessibility technique.
- Typography scale is about **size**, not font family, emphasis, color, line spacing
  or tracking: those still vary by purpose.
- The responsive breakpoint at 640px changes six shared roles, not individual sizes.
- At ≤360px the home photo shifts from 70px to 52px to preserve the display name.
- The home research background illustration remains untouched by this change.

Test: `npm test`; review the generated `dist/` on desktop and mobile.
