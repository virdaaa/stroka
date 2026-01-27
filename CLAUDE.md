# CLAUDE.md - Stroka Codebase Guide

This document provides guidance for AI assistants working with the Stroka codebase.

## Project Overview

**Stroka** (Строка, "stroka.app") is a Progressive Web Application (PWA) for reading and publishing short literary works. The tagline is "Короткие рассказы на каждый день" (Short stories every day).

- **Type**: Monolithic vanilla JavaScript web application
- **Language**: Russian (all UI and content)
- **Hosting**: GitHub Pages (custom domain: stroka.app)
- **Total codebase**: ~6,600 lines across 10 HTML files

## Tech Stack

### Backend
- **Supabase** (PostgreSQL-based backend-as-a-service)
  - URL: `https://xcnvejvkklypvkzkanwj.supabase.co`
  - Used for: authentication, story storage, ratings, user preferences, moderation

### Frontend
- Vanilla JavaScript (ES5+ syntax with `var`, `function`, no frameworks)
- Inline CSS with CSS custom properties
- No build tools, bundlers, or preprocessors
- Client-side rendered with dynamic DOM manipulation

### External Dependencies (CDN only)
- `@supabase/supabase-js@2` - Backend SDK
- Google Fonts: Cormorant Garamond, IBM Plex Sans, Literata
- Telegram Login Widget - Authentication via `@stroka_auth_bot`
- Yandex.Metrika (ID: 106258778) - Analytics with webvisor, clickmap, ecommerce tracking

## File Structure

```
/
├── index.html          # Main feed/home page (~695 lines)
├── read.html           # Story reading interface (~1170 lines)
├── search.html         # Search functionality (~1080 lines)
├── profile.html        # User profile & settings (~625 lines)
├── author.html         # Author dashboard/workspace (~670 lines)
├── admin.html          # Moderation interface (~790 lines)
├── moe.html            # User bookmarks & history (~660 lines)
├── stroka-pitch.html   # Landing/marketing page (~640 lines)
├── privacy.html        # Privacy policy (~170 lines)
├── terms.html          # Terms of service (~130 lines)
├── manifest.json       # PWA configuration
├── CNAME               # GitHub Pages custom domain (stroka.app)
└── icons/              # App icons (192x192, 512x512, apple-touch-icon)
```

## Key Features by Page

| Page | Primary Function |
|------|------------------|
| `index.html` | Smart feed with genre filtering, personalized recommendations, infinite scroll, author popups |
| `read.html` | Full story display, reading progress, voting (like/dislike), author info, bookmarks, age verification |
| `search.html` | Full-text search with filtering, author search, tag search, pagination |
| `author.html` | Story submission workflow, draft management, literacy scoring, edit tracking |
| `profile.html` | Authentication (Telegram/Email), user profile, achievements, notifications, settings |
| `moe.html` | Reading history, bookmarks, statistics |
| `admin.html` | Content moderation dashboard |

## Authentication

The app supports two authentication methods:
1. **Telegram Login** - Primary method via `@stroka_auth_bot` widget
2. **Email Magic Link** - Fallback via Supabase Auth

```javascript
// Telegram auth callback
function onTelegramAuth(user) {
    // user contains: id, first_name, last_name, username, photo_url, auth_date, hash
}

// Email auth
await db.auth.signInWithOtp({ email: email });
```

## Code Conventions

### HTML Structure
Each page follows this pattern:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <!-- Meta tags, fonts, Supabase SDK -->
    <style>/* All CSS inline */</style>
</head>
<body>
    <div class="app">
        <!-- Page content -->
    </div>
    <script>
        // All JavaScript inline at end of body
    </script>
</body>
</html>
```

### CSS Conventions
- **CSS Variables** defined in `:root` selector
- **Naming**: kebab-case for classes and IDs (`.short-card`, `#feed`, `--bg-primary`)
- **Color scheme** (dark theme):
  - Primary background: `#0a0a0b`
  - Secondary background: `#111113`
  - Accent (gold): `#c9a55c`
  - Text primary: `#e8e6e3`
  - Text secondary: `#8a8a8a`
- **Fonts**:
  - Display/titles: `var(--font-display)` - Cormorant Garamond
  - Body/reading: `var(--font-body)` - Literata
  - UI elements: `var(--font-ui)` - IBM Plex Sans
- **Layout**: Max-width 480px, mobile-first responsive design

### JavaScript Conventions
- Use `var` for variable declarations (ES5 compatibility)
- Use `function` keyword (not arrow functions)
- Global variables at top of script block
- Supabase client initialized as `db`:
  ```javascript
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  ```
- Async/await for database operations
- `localStorage` for caching and user state persistence

### Naming Patterns
- Database client: `db`
- Current user: `currentUser`
- Data arrays: plural nouns (`stories`, `shorts`)
- Event handlers: `setupEventListeners()`, `handleXxx()`
- Load functions: `loadData()`, `loadUserPreferences()`
- Render functions: `renderFeed()`, `renderStory()`
- Utility functions: `formatNumber()`, `formatDate()`

## Database Schema (Supabase)

Key tables:
- `stories` - Story content and metadata (title, genre, genres[], subgenres[], age_rating, literacy_score, similar_to[], status, views, published_at)
- `shorts` - Story segments/chapters (text, position, story_id)
- `authors` - Author profiles (name, pen_name, confirmed_age)
- `reactions` - Like/dislike votes (user_id, story_id, reaction: 'like'|'dislike')
- `user_preferences` - Genre preferences with weights (user_id, genre, weight)
- `reading_history` - User reading tracking (user_id, story_id)

Story statuses: `draft`, `pending`, `published`, `rejected`

Age ratings: `0+`, `6+`, `12+`, `16+`, `18+`

## State Management

- Global variables for application state
- `localStorage` keys:
  - `stroka_user` - Current user data
  - `stroka_confirmed_age` - Age verification
  - `stroka_feed_cache` - Feed data cache
  - Various page-specific caches

## Important Patterns

### Caching
```javascript
var CACHE_KEY = 'stroka_feed_cache';
var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function showCachedData() {
    var cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
            // Use cached data
        }
    }
}
```

### Age Verification
Content filtering based on confirmed user age (0, 6, 12, 16, 18+).

```javascript
function getRequiredAge(rating) {
    switch (rating) {
        case '18+': return 18;
        case '16+': return 16;
        case '12+': return 12;
        default: return 0;
    }
}

function filterByAge(items) {
    return items.filter(function(item) {
        var requiredAge = getRequiredAge(item.age_rating);
        return confirmedAge >= requiredAge;
    });
}
```

### Literacy Meter
Visual gauge showing text quality score (0-10):
- **Red** (low): score < 6
- **Yellow** (medium): score 6-8
- **Green** (high): score > 8

```javascript
function createLiteracyMeter(score) {
    var litClass = score < 6 ? 'low' : score <= 8 ? 'medium' : 'high';
    var litText = score < 6 ? 'Низкая' : score <= 8 ? 'Средняя' : 'Высокая';
    var angle = (score / 10) * 180 - 90; // Map 0-10 to -90° to 90°
    // Returns SVG gauge with rotating needle
}
```

### Author Popup
Clicking on author name shows a popup with author info and link to all their works:

```javascript
function showAuthorPopup(element, authorId, authorName) {
    closeAuthorPopup(); // Close any existing popup
    // Creates popup element with author avatar, name, and "Все произведения автора" button
}
```

### Smart Feed Algorithm
The `smartSort()` function personalizes the feed:
1. Groups shorts by story_id, picks random one per story
2. Filters out already-read stories (if user has read 5+ stories)
3. Scores each story based on:
   - Recency bonus (+3 for stories < 48h old)
   - Genre preference weights from user_preferences
   - Like percentage bonus (+0.5 if > 70% likes)
   - Random factor for variety
4. Limits to 2 stories per author

### Skeleton Loading
UI shows skeleton placeholders while data loads:
```html
<div class="skeleton-card">
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-author"></div>
</div>
```

## Development Guidelines

### When Modifying Code

1. **Preserve inline structure** - Keep CSS and JS inline within HTML files
2. **Maintain ES5 compatibility** - Use `var`, `function`, avoid modern syntax
3. **Keep Russian language** - All UI text should be in Russian
4. **Follow existing patterns** - Match the coding style of surrounding code
5. **Test on mobile** - Primary target is mobile PWA experience
6. **Respect max-width 480px** - All layouts designed for mobile viewport

### Common Tasks

**Adding a new feature:**
1. Find the relevant HTML file
2. Add CSS in the `<style>` block
3. Add JavaScript in the `<script>` block
4. Follow existing naming conventions

**Database queries:**
```javascript
// Select with join
var { data, error } = await db
    .from('stories')
    .select('*, authors (name, pen_name)')
    .eq('status', 'published');

// Insert
await db.from('reactions').insert({ user_id: id, story_id: storyId, reaction: 'like' });
```

**Navigation:**
```javascript
window.location.href = '/read.html?id=' + storyId;
```

### Things to Avoid

- Don't add build tools or frameworks
- Don't create separate CSS/JS files
- Don't use ES6+ features (let, const, arrow functions, template literals)
- Don't change the dark theme color scheme without explicit request
- Don't add English text to the UI

## Git Workflow

- Repository hosted on GitHub Pages
- Custom domain: stroka.app
- Commits typically follow: `Update [page].html`
- No branch naming conventions enforced

## Quick Reference

### Global Variables
| Variable | Purpose |
|----------|---------|
| `db` | Supabase client |
| `currentUser` | Logged-in user object |
| `stories` | Loaded story data array |
| `shorts` | Story segments array |
| `allShorts` | All shorts for pagination |
| `userPreferences` | Genre preferences map (genre -> weight) |
| `readStoryIds` | Set of read story IDs |
| `confirmedAge` | User's verified age (0, 6, 12, 16, 18) |
| `currentFilter` | Active feed filter ('foryou', 'new') |
| `currentGenre` | Active genre filter (string or empty) |
| `displayedCount` | Number of items shown in feed |
| `ITEMS_PER_PAGE` | Items to load per batch (10) |
| `CACHE_TTL` | Cache expiration time (5 minutes) |

### localStorage Keys
| Key | Purpose |
|-----|---------|
| `stroka_user` | Cached current user data |
| `stroka_confirmed_age` | User's verified age |
| `stroka_feed_cache` | Feed data with timestamp and filter state |

### CSS Variables
| Variable | Value | Purpose |
|----------|-------|---------|
| `--bg-primary` | `#0a0a0b` | Main background |
| `--bg-secondary` | `#111113` | Secondary background |
| `--bg-card` | `#161618` | Card background |
| `--bg-input` | `#1a1a1c` | Input field background |
| `--accent` | `#c9a55c` | Gold accent color |
| `--accent-dim` | `#8a7340` | Dimmed accent |
| `--text-primary` | `#e8e6e3` | Main text color |
| `--text-secondary` | `#8a8a8a` | Secondary text |
| `--text-muted` | `#5a5a5a` | Muted text |
| `--border` | `#2a2a2c` | Border color |
| `--danger` | `#c44` | Error/danger color |
| `--success` | `#4a8` | Success color |
| `--warning` | `#f0a030` | Warning color |

### Fonts
| Variable | Font Family | Usage |
|----------|-------------|-------|
| `--font-display` | Cormorant Garamond | Titles, headings |
| `--font-body` | Literata | Story reading content |
| `--font-ui` | IBM Plex Sans | UI elements, buttons |

### Available Genres
Хоррор, Мистика, Фантастика, Триллер, Драма, Детектив, Фэнтези, Романтика, Проза
