# 📘 CoreHead — Member 04 Complete Examiner Guide

> AI Layout Generation System — Full Reference Sheet
> Generated: 2026-05-04

---

---

# SECTION 1 — FULL CONTRIBUTION FLOW

---

## 🏗️ Architecture Overview

```
User (Browser)
    │
    ▼
[Frontend — Next.js]
    app/ai-prompt/page.jsx        ← Step 1: User enters prompt
    app/ai-options/page.jsx       ← Step 2 (optional): Pick style & layout
    app/ai-templates/page.jsx     ← Step 2 (alt): Pick a quick template
    app/builder/page.jsx          ← Step 3: AI triggered → blocks rendered
    app/ai-history/page.jsx       ← Step 4: Browse/restore past generations
    services/aiApi.js             ← HTTP client for /api/ai/*
    services/builderApi.js        ← HTTP client for /api/builder/*
        │
        │  HTTP POST with JWT Bearer Token
        ▼
[Backend — Express.js on port 5000]
    src/server.js                        ← Entry point, mounts all routes
    src/middlewares/authMiddleware.js    ← Verifies JWT on every AI request
    src/routes/aiRoutes.js              ← /api/ai/generate-layout & /history
    src/services/aiService.js           ← Core AI logic (Groq + fallback)
    src/routes/builderRoutes.js         ← /api/builder/layouts (CRUD)
    src/controllers/builderController.js ← Saves/loads builder_layouts table
        │
        │  Prisma ORM
        ▼
[PostgreSQL Database]
    ai_layouts table       ← Every AI generation (prompt + blocks)
    builder_layouts table  ← Manually saved builder layouts
```

---

## 📋 Step-by-Step Flow

### STEP 1 — User Enters a Prompt  (/ai-prompt)
- Page checks auth first → if no token, redirects to /login
- User types layout description
- Frontend validates: empty prompt → shows error
- Valid prompt → saved to localStorage as 'ai_prompt'
- User navigated to /builder

### STEP 2 — Builder Page Triggers AI (/builder)
- useEffect on mount reads localStorage['ai_prompt']
- Checks JWT token → if missing, redirects to /login
- Calls: builderApi.generateAILayout({ prompt, layoutType, designStyle, features })
- HTTP POST → /api/ai/generate-layout
- Returns { blocks: [...], isFallback }
- handleAIGenerated(blocks) → setAiPosts, setCompareMode(true)
- LocalStorage keys cleared after use

### STEP 3 — Backend Validates Request
- authMiddleware checks Bearer token → attaches req.user
- Rate limiter checks: max 10 requests per 15 minutes
- Input validation: prompt length, type, XSS check

### STEP 4 — AI Service Generates Layout
- Checks GROQ_API_KEY in .env
- If no key → rule-based fallback immediately
- If key exists → calls Groq API (llama-3.1-8b-instant)
- 20-second AbortController timeout
- Parses JSON response
- Zod schema validates the blocks array
- If validation fails → rule-based fallback

### STEP 5 — Save to Database
- prisma.ai_layouts.create({ user_id, prompt, layout_type, design_style, generated_layout })
- DB failure is NON-BLOCKING → layout still returned to user

### STEP 6 — Response to Frontend
- { success: true, blocks: [...], id: 42, isFallback: false }
- Builder shows Compare Mode: "Your Layout" vs "AI Generated Layout"
- User can: Accept AI, Edit it, or Discard it

### STEP 7 — AI History (/ai-history)
- Fetches from GET /api/ai/history
- Shows stats: Total Generations, Unique Styles, Layout Types
- Search by prompt text, filter by design style
- Restore: writes to localStorage → navigates to /builder
- Delete: DELETE /api/ai/history/:id

---

## 🗄️ Database Tables

### ai_layouts table
| Field            | Type        | Purpose                        |
|------------------|-------------|--------------------------------|
| id               | Int PK      | Auto-increment                 |
| user_id          | Int?        | Which user generated this      |
| prompt           | String      | The original prompt text       |
| layout_type      | VarChar(50) | e.g. blog-archive, single-post |
| design_style     | VarChar(50) | e.g. modern, editorial         |
| features         | Json        | Feature flags used             |
| generated_layout | Json        | The full blocks array          |
| created_at       | Timestamp   | Auto set on creation           |

### builder_layouts table
| Field        | Type        | Purpose                    |
|--------------|-------------|----------------------------|
| id           | Int PK      | Auto-increment             |
| name         | VarChar(255)| User-given layout name     |
| layout_data  | Json        | Cards + settings           |
| content_mode | VarChar(20) | 'static' or 'dynamic'      |
| grid_layout  | VarChar(50) | 'grid'                     |
| user_id      | Int?        | Owner                      |
| created_at   | Timestamp   | Creation time              |
| updated_at   | Timestamp   | Last update time           |

---

## 📁 Key Files Summary

### Backend Files
| File                                | Role                                            |
|-------------------------------------|-------------------------------------------------|
| src/routes/aiRoutes.js              | Validation, rate-limit, DB save, response       |
| src/services/aiService.js           | Groq API call, Zod validation, fallback         |
| src/routes/builderRoutes.js         | CRUD routes for builder layouts                 |
| src/controllers/builderController.js| DB operations for builder layouts               |
| src/middlewares/authMiddleware.js   | JWT verification                                |
| prisma/schema.prisma                | ai_layouts + builder_layouts table definitions  |

### Frontend Files
| File                                | Role                                            |
|-------------------------------------|-------------------------------------------------|
| app/ai-prompt/page.jsx              | Prompt input, suggestions, validation           |
| app/builder/page.jsx                | AI trigger, compare mode, save/load             |
| app/ai-history/page.jsx             | History viewer: search, filter, restore, delete |
| services/aiApi.js                   | HTTP client: generateLayout + getHistory        |
| services/builderApi.js              | HTTP client: save/load/delete builder layouts   |

---

---

# SECTION 2 — ALL LIMITS & WHERE TO CHANGE THEM

---

## ⏱️ Timeout Limit

File: src/services/aiService.js
Line: 160

```javascript
// Line 158-160
// AbortController 20s timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 20000);
//                                                      ↑
//                                              20000ms = 20 seconds
```

TO CHANGE: Replace 20000 with any value in milliseconds
  → 30 seconds = 30000
  → 10 seconds = 10000

---

## 🚦 Rate Limiter

File: src/routes/aiRoutes.js
Lines: 11-17

```javascript
// Line 11-17
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // ← Line 12: 15-minute window
  max: 10,                     // ← Line 13: max 10 requests
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

TO CHANGE:
  → Change window: replace "15 * 60 * 1000" with e.g. "5 * 60 * 1000" (5 minutes)
  → Change max requests: replace 10 with 5 or 20

---

## 📏 Prompt Length Limits

File: src/routes/aiRoutes.js

```javascript
// Line 25 — MINIMUM length check
if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
//                                                                    ↑
//                                                          Min = 5 characters
  return res.status(400).json({ error: 'Invalid prompt. Please enter at least 5 characters.' });
}

// Line 29 — MAXIMUM length check
if (prompt.length > 500) {
//                    ↑
//             Max = 500 characters
  return res.status(400).json({ error: 'Prompt too long (max 500 characters allowed).' });
}
```

TO CHANGE:
  → Min: change 5 to any number on line 25
  → Max: change 500 to any number on line 29

---

## 📊 All Limits — Quick Reference

| Limit             | File               | Line | Current Value        |
|-------------------|--------------------|------|----------------------|
| AI Timeout        | aiService.js       | 160  | 20000ms (20 seconds) |
| Rate window       | aiRoutes.js        | 12   | 15 minutes           |
| Max requests      | aiRoutes.js        | 13   | 10 per window        |
| Min prompt length | aiRoutes.js        | 25   | 5 characters         |
| Max prompt length | aiRoutes.js        | 29   | 500 characters       |
| History fetch     | ai-history/page.jsx| 49   | 50 records           |
| History default   | aiApi.js           | 30   | limit = 50           |

---

---

# SECTION 3 — ERROR HANDLING & VALIDATION (ALL LAYERS)

---

## LAYER 1 — Input Validation (aiRoutes.js Lines 25–36)

```javascript
// Check 1 — Prompt missing or too short (Line 25)
if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
  return res.status(400).json({ error: 'Invalid prompt. Please enter at least 5 characters.' });
}
// HTTP 400 Bad Request

// Check 2 — Prompt too long (Line 29)
if (prompt.length > 500) {
  return res.status(400).json({ error: 'Prompt too long (max 500 characters allowed).' });
}
// HTTP 400 Bad Request

// Check 3 — XSS Attack prevention (Line 34)
if (prompt.includes('<script>') || prompt.includes('</script>')) {
  return res.status(400).json({ error: 'Invalid prompt content. Script tags are not allowed.' });
}
// HTTP 400 Bad Request
```

---

## LAYER 2 — AI Service Error Handling (aiRoutes.js Lines 47–56)

```javascript
try {
  const result = await aiService.generateLayout(sanitizedPrompt);
} catch (err) {
  // Error 1 — Groq client failed to initialize (Line 48)
  if (err.message === 'AI_INIT_FAILED') {
    return res.status(503).json({ error: 'AI Service currently unavailable.' });
  }
  // HTTP 503 Service Unavailable

  // Error 2 — AI took more than 20 seconds (Line 51)
  if (err.message === 'AI_TIMEOUT') {
    return res.status(504).json({ error: 'AI request timed out. Please try again.' });
  }
  // HTTP 504 Gateway Timeout

  throw err; // bubbles to outer catch
}
```

---

## LAYER 3 — Inside aiService.js (Lines 117–210)

```javascript
// No API Key → Fallback immediately (Line 117)
if (!GROQ_API_KEY) {
  blocks = generateRuleBasedLayout(prompt);
  return { blocks, isFallback: true };
}

// Groq client init failed → fallback (Line 124)
if (!groq) {
  blocks = generateRuleBasedLayout(prompt);
  return { blocks, isFallback: true };
}

// 20-second timeout (Line 160)
const timeoutId = setTimeout(() => controller.abort(), 20000);
// → throws AbortError → caught → 'AI_TIMEOUT'

// JSON parse failure (Line 182)
try {
  parsedResult = JSON.parse(text);
} catch (parseError) {
  throw new Error('Failed to parse AI response as JSON.');
}

// Zod Schema Validation (Line 194)
const validation = layoutSchema.safeParse(parsedResult);
if (!validation.success) {
  throw new Error('AI response did not match expected schema.');
}
// → Falls back to rule-based layout

// AbortError catch (Line 203)
if (error.name === 'AbortError') {
  throw new Error('AI_TIMEOUT');
}
// → Any other error → fallback, isFallback = true
```

---

## LAYER 4 — Database Save (Non-blocking, aiRoutes.js Lines 71–73)

```javascript
try {
  saved = await prisma.ai_layouts.create({ ... });
} catch (dbErr) {
  console.warn('AI layout DB save failed:', dbErr.message);
  // Does NOT crash — layout is still returned to user!
}
```

---

## Error Handling Summary Table

| Check                | File               | Line | HTTP Code | What it handles                |
|----------------------|--------------------|------|-----------|-------------------------------|
| Empty/short prompt   | aiRoutes.js        | 25   | 400       | Missing or < 5 chars          |
| Prompt too long      | aiRoutes.js        | 29   | 400       | > 500 characters              |
| XSS script tag       | aiRoutes.js        | 34   | 400       | Script injection attack       |
| Rate limit exceeded  | aiRoutes.js        | 11   | 429       | > 10 requests / 15 min        |
| Auth missing/invalid | authMiddleware.js  | 9    | 401       | No or expired JWT token       |
| AI init failed       | aiRoutes.js        | 48   | 503       | Groq client broken            |
| AI timeout (20s)     | aiService.js       | 160  | 504       | Groq took too long            |
| JSON parse fails     | aiService.js       | 182  | fallback  | AI sent bad JSON              |
| Zod schema fails     | aiService.js       | 194  | fallback  | AI blocks have wrong shape    |
| No API key           | aiService.js       | 117  | fallback  | .env key missing              |
| DB save fails        | aiRoutes.js        | 71   | no crash  | Postgres unreachable          |

KEY POINT: The system NEVER crashes. Every error either returns a proper HTTP response
OR falls back to the rule-based layout generator. The user always gets a result.

---

---

# SECTION 4 — FRONTEND CHANGE POINTS FOR EXAMINER

---

## FILE: app/ai-prompt/page.jsx

### 1. Quick Suggestions List (Lines 22–29)
```javascript
const quickSuggestions = [
  { icon: '📄', label: 'Minimal blog post' },       // ← change labels
  { icon: '📰', label: 'Magazine style' },
  { icon: '🎴', label: 'Card grid archive' },
  { icon: '📊', label: 'Sidebar layout' },
  { icon: '📝', label: 'Long-form article' },
  { icon: '🎨', label: 'Portfolio showcase' }
];
```
Examiner may ask: "Add a new suggestion chip" or "Change the labels"

### 2. Frontend Prompt Validation (Lines 31–37)
```javascript
const handleGenerate = () => {
  if (!prompt.trim()) {
    setError('Please enter a prompt first.');  // ← change message here
    return;
  }
```
Examiner may ask: "Add a minimum character check on the frontend"
  → Change to: if (prompt.trim().length < 10) { setError('Prompt must be at least 10 characters.'); }

### 3. Textarea Placeholder (Line 88)
```javascript
placeholder="Create a modern single-post layout with a full-width hero image..."
```
Examiner may ask: "Change the placeholder text"

---

## FILE: app/builder/page.jsx

### 4. Column Options in Toolbar (Lines 283–286)
```javascript
<option value={1}>1 Column</option>
<option value={2}>2 Columns</option>
<option value={3}>3 Columns (Grid)</option>
<option value={4}>4 Columns</option>
```
Examiner may ask: "Add a 5-column option" — just add:
  <option value={5}>5 Columns</option>

### 5. Save Validation — Empty Canvas Check (Lines 128–133)
```javascript
if (blogPosts.length === 0) {
  setError('Cannot save an empty layout. Please add some components first.');
  setTimeout(() => setError(null), 4000);  // ← 4 seconds auto-clear
  return;
}
```
Examiner may ask: "Change the error duration" → replace 4000 with 6000
Examiner may ask: "Require at least 2 blocks" → change 0 to 1

### 6. Default Layout Type & Design Style (Lines 65–66)
```javascript
layoutType: options.layoutType || 'single-post',   // ← default layout type
designStyle: options.designStyle || 'modern',       // ← default design style
```
Examiner may ask: "Change default style to editorial" → replace 'modern' with 'editorial'

---

## FILE: app/ai-history/page.jsx

### 7. History Records Fetched (Line 49)
```javascript
const data = await aiApi.getHistory(50);
//                                    ↑ fetches last 50 records
```
Examiner may ask: "Reduce history to 10" → change 50 to 10

---

## FILE: services/aiApi.js

### 8. API Base URL / Port (Line 1)
```javascript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
//                                                                    ↑ port
```
Examiner may ask: "What if backend runs on port 8000?" → change 5000 to 8000

### 9. History Default Limit (Line 30)
```javascript
getHistory: async (limit = 50) => {
//                          ↑ default limit parameter
```
Examiner may ask: "Change default history limit" → replace 50 with any number

---

## All Frontend Change Points — Quick Table

| What to Change           | File                    | Line  | Current Value              |
|--------------------------|-------------------------|-------|----------------------------|
| Quick suggestion labels  | ai-prompt/page.jsx      | 22–29 | 6 chips                    |
| Frontend error message   | ai-prompt/page.jsx      | 33    | "Please enter a prompt..." |
| Textarea placeholder     | ai-prompt/page.jsx      | 88    | long description text      |
| Column options           | builder/page.jsx        | 283–286| 1/2/3/4 columns           |
| Empty canvas error msg   | builder/page.jsx        | 129   | current message            |
| Error auto-clear time    | builder/page.jsx        | 130   | 4000ms (4 seconds)         |
| Default layout type      | builder/page.jsx        | 65    | 'single-post'              |
| Default design style     | builder/page.jsx        | 66    | 'modern'                   |
| History display limit    | ai-history/page.jsx     | 49    | 50 records                 |
| API base URL / port      | services/aiApi.js       | 1     | localhost:5000             |
| History default limit    | services/aiApi.js       | 30    | 50                         |

---

---

# SECTION 5 — SECURITY FEATURES SUMMARY

| Feature                      | Where                  | Details                        |
|------------------------------|------------------------|--------------------------------|
| JWT Auth on every AI endpoint| authMiddleware.js      | Bearer token verified          |
| Rate limiting                | aiRoutes.js line 11    | 10 req / 15 min per IP         |
| XSS prevention               | aiRoutes.js line 34    | Blocks <script> in prompt      |
| Prompt length validation     | aiRoutes.js lines 25,29| Min 5 / Max 500 chars          |
| 20-second AI timeout         | aiService.js line 160  | AbortController                |
| Zod schema validation        | aiService.js line 185  | Validates AI output shape      |
| Rule-based fallback          | aiService.js line 6    | Always returns a layout        |
| Non-blocking DB save         | aiRoutes.js line 71    | DB error never crashes server  |
| Auth check on frontend pages | builder + ai-history   | Redirects to /login if no JWT  |

---

END OF GUIDE
