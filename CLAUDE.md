# CLAUDE.md - Stroka Codebase Guide

This document provides guidance for AI assistants working with the Stroka codebase.

## Project Overview

**Stroka** (Строка, "stroka.app") is a Progressive Web Application (PWA) for reading and publishing short literary works. The tagline is "Короткие рассказы на каждый день" (Short stories every day).

- **Type**: Monolithic vanilla JavaScript web application
- **Language**: Russian (all UI and content)
- **Hosting**: GitHub Pages (custom domain: stroka.app)

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
- Yandex.Metrika - Analytics

## File Structure

```
/
├── index.html          # Main feed/home page (~530 lines)
├── read.html           # Story reading interface (~1110 lines)
├── search.html         # Search functionality (~1075 lines)
├── profile.html        # User profile & settings (~625 lines)
├── author.html         # Author dashboard/workspace (~670 lines)
├── admin.html          # Moderation interface (~790 lines)
├── moe.html            # User bookmarks & history (~655 lines)
├── stroka-pitch.html   # Landing/marketing page (~640 lines)
├── privacy.html        # Privacy policy (~170 lines)
├── terms.html          # Terms of service (~130 lines)
├── manifest.json       # PWA configuration
├── CNAME               # GitHub Pages custom domain
└── icons/              # App icons (192x192, 512x512)
```

## Key Features by Page

| Page | Primary Function |
|------|------------------|
| `index.html` | Smart feed with genre filtering, personalized recommendations, infinite scroll |
| `read.html` | Full story display, reading progress, voting (like/dislike), author info |
| `search.html` | Full-text search with filtering and pagination |
| `author.html` | Story submission workflow, draft management, literacy scoring |
| `profile.html` | Authentication, user profile, achievements, settings |
| `moe.html` | Reading history, bookmarks, statistics |
| `admin.html` | Content moderation dashboard |

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
- `stories` - Story content and metadata
- `shorts` - Story segments/chapters
- `authors` - Author profiles
- `reactions` - Like/dislike votes
- `user_preferences` - Genre preferences with weights
- `reading_history` - User reading tracking

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

| Variable | Purpose |
|----------|---------|
| `db` | Supabase client |
| `currentUser` | Logged-in user object |
| `stories` | Loaded story data |
| `shorts` | Story segments |
| `userPreferences` | Genre preferences map |
| `readStoryIds` | Set of read story IDs |
| `confirmedAge` | User's verified age |

| CSS Variable | Value |
|--------------|-------|
| `--bg-primary` | `#0a0a0b` |
| `--bg-secondary` | `#111113` |
| `--bg-card` | `#161618` |
| `--accent` | `#c9a55c` |
| `--text-primary` | `#e8e6e3` |
| `--text-secondary` | `#8a8a8a` |
| `--border` | `#2a2a2c` |
