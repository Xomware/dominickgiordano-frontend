# Plan: dominickgiordano.com v1

**Status:** Ready
**Approved:** 2026-11-12, in session with Dominick

## Goal

A personal resume site under Dominick's own name, replacing xomware.com as his main URL. xomware.com stays up
as the landing page for the Xomware apps; this site links to it.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Domain | dominickgiordano.com | domgiordano.com is taken; this matches the LinkedIn URL `/in/dominick-giordano` |
| Stack | Vite + TypeScript, no framework | One page, no routing, forms or auth. Content ships as real HTML for search and link previews |
| Repos | `Xomware/dominickgiordano-frontend` + `Xomware/dominickgiordano-infrastructure` | Same pattern and shared workflows as every other app |
| Hosting | S3 + CloudFront via the `web-hosting` Terraform module | Same as the other apps |
| Design | Mockup "domgiordano.com v4" (https://claude.ai/artifact/MxJfZMktgmXZLkpo18sRgg) | Approved, with one change: app icons keep full color |

## Design summary

- Black and white. Dark by default, Light switch in the toolbar.
- Order: hero, About (photo display + bio + stack), Lumist Labs ticker band, Lumist Labs, numbers, apps ticker
  band, Xomware apps, Experience + certs, Contact.
- Sticky toolbar (dot DG mark, nav with scroll-spy, Dark/Light, replay intro). Side rails on wide screens: links
  on the left, section dots on the right.
- A full-screen dot field animates behind the page and dims under text (`data-quiet`).
- Intro: boot scan, "HELLO / I'M DOM" typed in dots, dissolve into the DG monogram, page fades in.

## Pieces

| # | Repo | PR | Size | Depends on |
|---|---|---|---|---|
| 1 | frontend | Scaffold: Vite + TS strict, CI build, CLAUDE.md, this plan | ~80 | none |
| 2 | frontend | Static page: content, layout, toolbar, rails, dark/light | ~350 | 1 |
| 3 | frontend | Dot field background | ~250 | 2 |
| 4 | frontend | Intro + LED components (ticker, photo display, scramble, count-up) | ~200 | 3 |
| 5 | frontend | Launch polish: meta, favicon, OG image, robots/sitemap, Playwright smoke test | ~150 + tests | 4 |
| 6 | frontend | Deploy workflow (shared deploy-frontend-s3) | ~25 | 7 applied |
| 7 | infrastructure | Terraform: web-hosting module, OIDC deploy role, terraform workflow | ~120 | domain bought |
| 8 | xomware-frontend | Footer link to dominickgiordano.com | ~10 | launch |

PRs 2 to 5 stack on each other. Each merges on its own with a working page.

## Dominick's steps

1. Buy dominickgiordano.com in Route53. That creates the hosted zone Terraform looks up.
2. Create the Infisical folder `/dominickgiordano` and bootstrap the Terraform role the same way as the other
   app infrastructure repos.
3. Send content: certifications, a photo, job history with dates, and what he owned on each Lumist product.

## Launch blockers

- Every dashed placeholder in index.html is replaced with real content (certs, history, photo, Lumist roles).
- Lumist Labs is fine with the six products being shown, BD Pulse in particular since it is internal.
