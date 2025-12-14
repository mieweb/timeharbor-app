# Time Harbor Development Guidelines

## Semantic HTML Class Naming Convention

All HTML elements (especially `<div>`) MUST have semantic class names that describe their purpose. This helps with:
- Code readability and maintenance
- Debugging (easily identify elements in DevTools)
- Directing future development
- Accessibility and styling consistency

### Naming Pattern

Use BEM-inspired naming with descriptive prefixes:

\`\`\`
[component]-[element]
[component]-[element]__[modifier]
\`\`\`

### Examples

\`\`\`tsx
// Good - semantic classes describe purpose
<div className="app-shell">
  <header className="app-header">
    <div className="header-team-selector">...</div>
    <div className="header-timer-status">...</div>
  </header>
  <main className="app-main-content">...</main>
  <nav className="app-footer-nav">...</nav>
</div>

// Bad - no semantic meaning
<div className="flex min-h-screen">
  <div className="flex items-center">...</div>
</div>
\`\`\`

### Required Semantic Prefixes

| Prefix | Use For |
|--------|---------|
| `app-` | Top-level app structure |
| `page-` | Page-level containers |
| `section-` | Major page sections |
| `card-` | Card components |
| `list-` | List containers |
| `item-` | List items |
| `form-` | Form elements |
| `modal-` | Modal/dialog elements |
| `nav-` | Navigation elements |
| `header-` | Header elements |
| `footer-` | Footer elements |
| `btn-` | Button variations |
| `stat-` | Statistics/metrics |
| `timer-` | Timer-related elements |
| `ticket-` | Ticket-related elements |
| `team-` | Team-related elements |
| `member-` | Member-related elements |
| `sync-` | Sync status elements |
| `toast-` | Toast notifications |
| `empty-` | Empty state elements |
| `skeleton-` | Loading skeleton elements |

### Rules

1. **Every `<div>` must have a semantic class** - No anonymous divs
2. **Semantic class comes first** - Before Tailwind utilities
3. **Be specific** - `ticket-card-actions` not just `actions`
4. **Use consistent naming** - Follow existing patterns in codebase
5. **Document new prefixes** - Add to this file when creating new patterns

### Implementation

\`\`\`tsx
// Template
<div className="[semantic-class] [tailwind-utilities]">

// Real example
<div className="ticket-card-header flex items-start justify-between gap-3">
