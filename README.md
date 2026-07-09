# 🔍 Shopify Live Search & Filter — Dawn Edition

> A fully-featured, production-ready Live Search & Collection Filter built specifically for **Shopify's Dawn Theme (v14+)** — instant predictive search, AJAX filtering, URL sync, price range slider, multi-select facets — no app required.

![Shopify Dawn](https://img.shields.io/badge/Shopify-Dawn_Theme_v14+-96BF48?style=flat-square&logo=shopify&logoColor=white)
![Liquid](https://img.shields.io/badge/Liquid-Templating-0090D6?style=flat-square)
![Online Store 2.0](https://img.shields.io/badge/Online_Store-2.0-orange?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+_Web_Components-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Accessible](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🎯 Why This Exists

Shopify's default search is basic and collection filtering requires an expensive app. This project gives merchants a **full-featured search and filter experience** that works out of the box with Dawn — no apps, no monthly fees, no performance overhead.

---

## ✨ Features

### 🔎 Live Predictive Search
- Instant results using Shopify's **Predictive Search API**
- Debounced input (300ms) — no unnecessary API calls
- Product image, title, vendor, and price in results
- Keyboard navigation ↑ ↓ Enter Escape
- Recent searches saved to localStorage (with remove)
- Loading spinner per search
- Empty state with helpful message
- Screen reader live announcements (ARIA)

### 🗂️ Collection Filtering
- AJAX filtering — **no page reload**
- Multi-select checkbox facets (size, color, type, vendor, etc.)
- Color swatch support for color filters
- Dual-handle price range slider + manual number inputs
- Sort by dropdown (price, date, best selling, A–Z, etc.)
- Active filter tags with individual remove buttons
- Clear all filters button
- URL sync via `pushState` — browser back/forward works
- Product count updates live
- Loading state on grid during filter fetch
- Empty results state with clear filters CTA
- AJAX pagination

### 📱 Mobile
- Mobile filter drawer (slides in from left)
- Filter count badge on toggle button
- Focus trap inside drawer
- Touch/swipe friendly
- Responsive product grid (1→2→3→4 cols)

### ♿ Accessibility
- `role="combobox"` + `aria-haspopup` on search
- `aria-live` regions for result announcements
- `role="listbox"` + `role="option"` on search results
- `aria-expanded` states throughout
- `role="dialog"` + `aria-modal` on filter drawer
- Focus trap in drawer
- Keyboard navigation everywhere
- `prefers-reduced-motion` support
- `noscript` fallback for filter form

---

## 📁 File Structure

```
dawn/
│
├── sections/
│   └── search-filter.liquid            ← Main section
│
├── snippets/
│   ├── search-bar.liquid               ← Predictive search input + results
│   ├── filter-facets.liquid            ← Checkbox facets + price range
│   ├── filter-drawer.liquid            ← Mobile filter drawer
│   └── search-result-item.liquid       ← Product card (uses Dawn's card CSS)
│
└── assets/
    ├── search-filter.js                ← All logic (5 Web Components)
    └── search-filter.css               ← Dawn-compatible styles
```

---

## ⚙️ Dawn Conventions Used

| Convention | Implementation |
|---|---|
| **Web Components** | `PredictiveSearch`, `FacetFilters`, `FilterDrawer` extend `HTMLElement` |
| **CSS Custom Properties** | `--color-foreground`, `--color-base-background-1`, `--font-body-family` |
| **Button Classes** | `.button`, `.button--primary`, `.button--secondary`, `.button--tertiary` |
| **Container** | `.page-width` |
| **Color Scheme** | `color_scheme` setting picker |
| **Card Components** | Uses Dawn's `component-card.css`, `component-price.css`, `component-badge.css` |
| **Section Padding** | Standard `padding_top` / `padding_bottom` range settings |
| **Price Structure** | `.price`, `.price--on-sale`, `.price__sale`, `.price__compare` |
| **Accessibility** | `.visually-hidden`, `aria-live`, focus trap pattern |
| **Translation Keys** | `t:sections.search-filter.*` i18n keys |
| **URL Structure** | Shopify's `?filter.p.m.*` facet URL pattern |
| **Sections API** | Uses `?sections=search-filter` for AJAX render |

---

## 🚀 Installation

### Step 1 — Upload files to your Dawn theme

In **Online Store → Themes → Edit Code:**

```
sections/  → search-filter.liquid
snippets/  → search-bar.liquid
snippets/  → filter-facets.liquid
snippets/  → filter-drawer.liquid
snippets/  → search-result-item.liquid
assets/    → search-filter.js
assets/    → search-filter.css
```

### Step 2 — Enable Shopify Search & Discovery filters

1. Go to **Apps → Search & Discovery**
2. Under **Filters**, enable the filters you want (Size, Color, Price, etc.)
3. Assign filters to your collections

### Step 3 — Add section to a collection page template

In the Theme Editor:
1. Go to a **Collection** page
2. Click **Add section**
3. Select **Search & Filter**
4. Configure settings

### Step 4 — Configure in Theme Editor

| Setting | Description |
|---|---|
| Show Search Bar | Toggle predictive search on/off |
| Search Placeholder | Custom placeholder text |
| Max Search Results | How many products to show (3–10) |
| Products Per Page | Grid pagination size (8–48) |
| Columns Desktop | 2, 3, or 4 column grid |
| Filter Position | Sidebar / Top (horizontal) / Drawer |
| Show Sort Dropdown | Toggle sort by control |
| Default Sort | Starting sort order |

---

## 🔌 JavaScript Web Components

| Component | Element | Responsibility |
|---|---|---|
| `PredictiveSearch` | `<predictive-search>` | Search API calls, results rendering, keyboard nav, recent searches |
| `FacetFilters` | `<facet-filters>` | AJAX filter fetching, URL sync, DOM updates |
| `FilterDrawer` | `<filter-drawer>` | Mobile drawer open/close, focus trap |
| `PriceRange` | Class (auto-init) | Dual-handle slider sync with number inputs |
| `ShowMore` | Function (auto-init) | Show/hide extra facet values |

---

## 🧪 Edge Cases Handled

| Scenario | Behavior |
|---|---|
| Search query < 2 chars | Results panel closes, no API call |
| Network error on search | Error message shown in results panel |
| No search results | "No results" state with search tip |
| Filter returns 0 products | Empty state with clear filters CTA |
| Filter fetch fails | Console warning, UI stays usable |
| Browser back button | Restores previous filter state via `popstate` |
| Price range min > max | Min thumb clamped to max - 1 |
| Price range max < min | Max thumb clamped to min + 1 |
| No JS (noscript) | Submit button shown for standard form filter |
| Facet show more | Extra values hidden until "show more" clicked |
| Recently removed search | Removed from localStorage immediately |
| Mobile drawer open | Body scroll locked, focus trapped |

---

## 📋 Roadmap

- [ ] Search suggestions (trending / popular)
- [ ] Search analytics tracking
- [ ] Filter by availability (In Stock toggle)
- [ ] Star rating filter support
- [ ] Infinite scroll (replace pagination)
- [ ] Save filter presets per collection

---

## 👤 Author

**John Venedick Natividad**
Senior Shopify Developer & Implementation Specialist
14+ years building eCommerce experiences for global brands

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/jaynatividad)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/jaynatividad1489)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:jaynatividad1489@gmail.com)

---

## 📄 License

MIT — free to use in personal and commercial Shopify projects.
If this saved you time, a ⭐ star on the repo is always appreciated!
