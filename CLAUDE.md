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
  - Used for: authentication, story storage, ratings, user preferences, moderation, notifications

### AI Services
- **AI Worker**: `https://ai.stroka.app`
  - Story analysis (genres, subgenres, age rating)
  - Literacy scoring
  - Content moderation
  - Shorts generation (excerpts)

### Frontend
- Vanilla JavaScript (mixed ES5/ES6 - some files use `var`, others use `const`/`let`)
- Inline CSS with CSS custom properties
- No build tools, bundlers, or preprocessors
- Client-side rendered with dynamic DOM manipulation

### External Dependencies (CDN only)
- `@supabase/supabase-js@2` - Backend SDK
- Google Fonts: Cormorant Garamond, IBM Plex Sans, Literata
- Yandex.Metrika (ID: 106258778) - Analytics
- Telegram Login Widget - Authentication

## File Structure

```
/
├── index.html          # Main feed/home page (~696 lines)
├── read.html           # Story reading interface (~1170 lines)
├── search.html         # Search functionality with top lists (~1079 lines)
├── profile.html        # User profile, achievements, settings (~627 lines)
├── author.html         # Author dashboard/workspace (~669 lines)
├── admin.html          # Moderation interface (~792 lines)
├── moe.html            # User bookmarks & history (~659 lines)
├── stroka-pitch.html   # Landing/marketing page
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
├── manifest.json       # PWA configuration
├── CNAME               # GitHub Pages custom domain (stroka.app)
└── icons/              # App icons (192x192, 512x512, apple-touch-icon)
```

## Key Features by Page

| Page | Primary Function |
|------|------------------|
| `index.html` | Smart feed with genre filtering, personalized recommendations, infinite scroll, literacy meter display |
| `read.html` | Full story display, reading progress tracking, voting (like/dislike), author subscriptions, age verification modal, bookmarks |
| `search.html` | Full-text search, top stories by views/likes with time filters, author search |
| `author.html` | Story submission workflow with AI analysis, draft management, edit limits (max 3 edits) |
| `profile.html` | Telegram/email auth, achievements system, reading statistics, age settings |
| `moe.html` | Reading history (continue/finished), bookmarks, author subscriptions |
| `admin.html` | Content moderation dashboard (requires admin/moderator role) |

## Code Conventions

### HTML Structure
Each page follows this pattern:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <!-- Meta tags, fonts, Supabase SDK -->
    <style>/* All CSS inline */</style>
    <!-- Yandex.Metrika counter -->
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
  - Card background: `#161618`
  - Input background: `#1a1a1c`
  - Accent (gold): `#c9a55c`
  - Accent dim: `#8a7340`
  - Text primary: `#e8e6e3`
  - Text secondary: `#8a8a8a`
  - Text muted: `#5a5a5a`
  - Border: `#2a2a2c`
  - Success: `#4caf50` / `#4a8`
  - Danger: `#f44336` / `#c44`
  - Warning: `#ff9800`
- **Fonts**:
  - Display/titles: `var(--font-display)` - Cormorant Garamond
  - Body/reading: `var(--font-body)` - Literata
  - UI elements: `var(--font-ui)` - IBM Plex Sans
- **Layout**: Max-width 480px for most pages, 680px for read.html, 800px for admin.html

### JavaScript Conventions
- Mixed ES5/ES6: `index.html` and `author.html` use `var`, others use `const`/`let`
- Use `function` keyword for function declarations
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
- Current author: `currentAuthor`
- Data arrays: plural nouns (`stories`, `shorts`)
- Event handlers: `setupEventListeners()`, `handleXxx()`
- Load functions: `loadData()`, `loadUserPreferences()`, `loadStats()`
- Render functions: `renderFeed()`, `renderStory()`, `renderAchievements()`
- Utility functions: `formatNumber()`, `formatTimeAgo()`, `pluralize()`

## Database Schema (Supabase)

Key tables:
- `stories` - Story content and metadata (title, full_text, genres, subgenres, age_rating, literacy_score, status, edit_count, views)
- `shorts` - Story excerpts/segments (text, position, story_id)
- `authors` - Author profiles (name, pen_name, email, telegram_id, role, confirmed_age, bio)
- `reactions` - Like/dislike votes (user_id, story_id, reaction)
- `user_preferences` - Genre preferences with weights
- `reading_history` - User reading tracking (read_percent, read_time_seconds, finished_at)
- `subscriptions` - Author subscriptions (user_id, author_id)
- `moderation_queue` - Stories pending moderation (ai_status, ai_reason, literacy_score)
- `notifications` - User notifications (type, title, message, link, is_read)

## State Management

- Global variables for application state
- `localStorage` keys:
  - `stroka_user` - Current user data `{ id, email, telegram_id }`
  - `stroka_author` - Current author data (full author object)
  - `stroka_confirmed_age` - Age verification (0, 6, 12, 16, 18)
  - `stroka_feed_cache` - Feed data cache
  - `stroka_bookmarks` - Array of bookmarked story IDs
  - `stroka_history` - Local reading history (anonymous users)
  - `stroka_recent_searches` - Recent search queries

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
Content filtering based on confirmed user age (0, 6, 12, 16, 18+). Modal shown for restricted content:
```javascript
function getRequiredAge(rating) {
    switch (rating) {
        case '18+': return 18;
        case '16+': return 16;
        case '12+': return 12;
        default: return 0;
    }
}
```

### Literacy Meter
Visual gauge showing text quality score (0-10):
- Red (low): score < 6
- Yellow (medium): score 6-8
- Green (high): score > 8

```javascript
function createLiteracyMeter(score) {
    var litClass = score < 6 ? 'low' : score <= 8 ? 'medium' : 'high';
    // SVG semi-circle gauge with rotating needle
}
```

### Authentication
Two methods supported:
1. **Telegram Login** - Uses widget, creates/updates author with telegram_id
2. **Email OTP** - Supabase auth.signInWithOtp, then verifyOtp

```javascript
// Telegram auth callback
function onTelegramAuth(user) {
    handleTelegramLogin(user);
}

// Email OTP flow
await db.auth.signInWithOtp({ email: email });
await db.auth.verifyOtp({ email: pendingEmail, token: code, type: 'email' });
```

### Story Edit Limits
Authors can edit stories max 3 times (including initial publish):
```javascript
var MAX_EDITS = 3;
// edit_count field in stories table tracks this
```

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
2. **Match existing style** - Use `var` in index.html/author.html, `const`/`let` in others
3. **Keep Russian language** - All UI text should be in Russian
4. **Follow existing patterns** - Match the coding style of surrounding code
5. **Test on mobile** - Primary target is mobile PWA experience
6. **Respect max-width** - 480px for main pages, 680px for read.html

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

// Upsert
await db.from('reading_history').upsert({
    user_id: currentUser.id,
    story_id: storyId,
    read_percent: maxScrollPercent
}, { onConflict: 'user_id,story_id' });

// RPC call
await db.rpc('increment_views', { story_uuid: storyId });
```

**Navigation:**
```javascript
window.location.href = '/read.html?id=' + storyId;
```

**AI Worker call (author.html):**
```javascript
var response = await fetch(AI_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text, title: storyData.title })
});
var result = await response.json();
// Returns: genres, subgenres, age_rating, shorts, moderation, literacy
```

### Things to Avoid

- Don't add build tools or frameworks
- Don't create separate CSS/JS files
- Don't change the dark theme color scheme without explicit request
- Don't add English text to the UI
- Don't expose sensitive API keys (Telegram bot token in admin.html is intentional for notifications)

## Admin Access

Admin emails are hardcoded in profile.html:
```javascript
var ADMIN_EMAILS = ['svalka.plus@gmail.com', 'admin@stroka.app'];
```

Admin/moderator access in admin.html is checked via `authors.role` field.

## Quick Reference

| Variable | Purpose |
|----------|---------|
| `db` | Supabase client |
| `currentUser` | Logged-in user object `{ id, email }` |
| `currentAuthor` | Full author record from DB |
| `stories` | Loaded story data |
| `shorts` | Story excerpts |
| `userPreferences` | Genre preferences map |
| `readStoryIds` | Set of read story IDs |
| `confirmedAge` | User's verified age (0/6/12/16/18) |
| `editingStoryId` | Story being edited (author.html) |
| `localBookmarks` | Array of bookmarked story IDs |

| CSS Variable | Value |
|--------------|-------|
| `--bg-primary` | `#0a0a0b` |
| `--bg-secondary` | `#111113` |
| `--bg-card` | `#161618` |
| `--bg-input` | `#1a1a1c` |
| `--accent` | `#c9a55c` |
| `--accent-dim` | `#8a7340` |
| `--text-primary` | `#e8e6e3` |
| `--text-secondary` | `#8a8a8a` |
| `--text-muted` | `#5a5a5a` |
| `--border` | `#2a2a2c` |

| Constant | Value | Location |
|----------|-------|----------|
| `SUPABASE_URL` | `https://xcnvejvkklypvkzkanwj.supabase.co` | All files |
| `AI_WORKER_URL` | `https://ai.stroka.app` | author.html |
| `CACHE_TTL` | 5 minutes | index.html |
| `MAX_EDITS` | 3 | author.html |
| `ITEMS_PER_PAGE` | 10 | index.html |
