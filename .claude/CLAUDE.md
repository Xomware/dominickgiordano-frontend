# dominickgiordano-frontend

> Dominick Giordano's personal resume site: [dominickgiordano.com](https://dominickgiordano.com)

## What This Is
One static page: hero, About, Lumist Labs work, Xomware apps, experience and certs, contact. A canvas dot-matrix
field animates behind it. xomware.com stays the hub for the apps; this site links to it.

## Stack
- Vite + TypeScript (strict), no framework
- Plain CSS with tokens on `:root`; dark default, light via `data-look="light"`
- Canvas 2D for the dot field and LED components

## Key Commands
```bash
npm run dev      # dev server (127.0.0.1:5173)
npm run check    # type check
npm run build    # check + production build to dist/
npm test         # Playwright smoke tests against a built preview
```

## Important Paths
```
index.html          # all page content lives here as real HTML (SEO, link previews)
src/main.ts         # entry
src/styles.css      # tokens + layout
public/             # icons, favicon, OG image, robots, sitemap
docs/features/      # plans
```

## Project Config
```yaml
pm_tool: none
base_branch: master
test_commands:
  - npm run check
  - npm test
build_commands:
  - npm run build
```

## Constraints
- Content stays in index.html, never rendered from JS, so crawlers and LinkedIn previews see it.
- Text sits on panels or `data-quiet` regions; the dot field dims under them. Don't put copy on raw animation.
- Everything animated must have a static frame under `prefers-reduced-motion`.
- App icons keep their full color.
- Hosting is S3 + CloudFront from `Xomware/dominickgiordano-infrastructure`; deploys use the shared
  `Xomware/github-actions` deploy-frontend-s3 workflow.

## Lessons
