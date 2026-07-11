# T15 — Authorization audit (multi-tenant)

Date: 2026-07-11

## Threats checked

| Threat | Mitigation |
|--------|------------|
| Access another site’s admin data via forged `X-Site-Id` | `requireSite` verifies JWT user is owner/member (or platform admin) |
| Call admin APIs with only `X-Site-Id` (no auth) | `requireSite` now returns **401** without `req.user` |
| List all tenants’ published posts via `/preview/posts` | **Requires `siteId`**; empty/global dump removed |
| Read draft by public slug | `getPostBySlug` returns **404** unless Published |
| Cross-tenant same slug collision | Public slug **requires `siteId`** |
| Moderate comments from other sites | Comments admin routes use **auth + requireSite**; filter `post.siteId` |
| Comment on draft posts | Public create only if post is live |
| Inactive/suspended site management | `requireSite` rejects non-`active` sites |

## Routes (admin content)

Always: `authMiddleware` → `requireSite` → handler

- posts, categories, media, settings, templates (protected), builder, comments (admin)

## Public routes

| Route | Scope |
|-------|--------|
| `GET /api/sites/by-slug/:slug` | Active sites only |
| `GET /api/preview/posts?siteId=` | That site’s Published posts only |
| `GET /api/posts/slug/:slug?siteId=` | That site’s Published post only |
| `POST /api/comments` | Live post only; optional site match |

## Residual risks / follow-ups

- `pageController` still uses non-scoped `prisma.page` (legacy / broken model) — disable or rewrite before enabling Pages UI in multi-tenant.
- Platform `admin` role can open any `X-Site-Id` by design — document for operators.
- Rate limiting on public comment create recommended.
- T16: UX empty states when siteId missing on frontend.

## Manual test checklist

1. User A token + User B `X-Site-Id` → **403** on `GET /posts`
2. No token + `X-Site-Id` → **401** on `GET /posts`
3. `GET /preview/posts` without siteId → **400**
4. Draft post public slug → **404**
5. Published post public slug with correct siteId → **200**
6. Comments list only returns current site’s comments
