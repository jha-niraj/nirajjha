# nirajjha.in

Personal site and blog for Niraj Kumar Jha. Next.js 14 App Router, TypeScript,
Tailwind, MDX content, Drizzle + Neon for engagement data.

## Package manager

**pnpm only.** Never run `npm install` or `yarn` in this repo. `package.json`
declares `packageManager: pnpm@10.33.0`, which is what corepack and Vercel read
to pick the right package manager, and `package-lock.json` / `yarn.lock` are
gitignored so a stray npm run cannot commit a second lockfile.

There is deliberately no `preinstall` guard and no `.npmrc`. Both existed once
and were removed: the guard shelled out to npm and fetched a package over the
network on every install, and the `.npmrc` that muted the resulting warnings
also muted pnpm itself, so a working `pnpm install` printed nothing at all and
looked like a failure. `packageManager` does the real enforcement where it
counts, which is CI and Vercel.

```
pnpm dev          # dev server
pnpm build        # production build
pnpm lint
pnpm typecheck
pnpm icons        # regenerate favicons + hero portrait from public/nirajjha.jpeg
pnpm db:generate  # write a SQL migration from schema changes
pnpm db:migrate   # apply pending migrations to DATABASE_URL
pnpm db:studio    # browse the data
pnpm resend:setup # create/find the newsletter segment, print its id
pnpm blog:sync    # mirror MDX frontmatter into the posts table (runs on postbuild)
pnpm blog:broadcast          # DRY RUN: show what would be emailed
pnpm blog:broadcast --send   # actually send
pnpm links:check  # verify every outbound link in content/ and resume.tsx
```

`db:push` is intentionally not used: it needs an interactive TTY and diffs
against live state. `db:generate` + `db:migrate` means the SQL that runs in
production is a committed file that already ran locally.

## Environment

`DATABASE_URL` (Neon) lives in `.env` or `.env.local`. **Both are gitignored**,
and `.gitignore` covers plain `.env`, not just `.env*.local`, because that is
where the connection string actually ends up. Only `.env.example` is committed.

`RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `RESEND_SEGMENT_ID` drive the
newsletter. `SITE_URL` sets the origin used in email links.

**Resend renamed Audiences to Segments.** It is one id used two ways, which is
the single most confusing thing about this integration:

- `resend.contacts.create({ audienceId })` still uses the old key name
- `resend.broadcasts.create({ segmentId })` uses the new one

`RESEND_AUDIENCE_ID` is still read as a legacy alias. Without either, the id is
resolved by name (`RESEND_SEGMENT_NAME`, default `nirajjha.in`) and cached for
the process.

The database is optional. Without `DATABASE_URL`, `db` is null, every read in
`src/db/queries.ts` returns a zeroed fallback, and the site builds and serves
normally with engagement showing zero. Reads are wrapped in `safeRead` so a
database outage can never fail a prerender; writes are deliberately not wrapped
so a failed comment surfaces an error to the person who wrote it.

## Writing rules

### Never use em-dashes

**Do not use the em-dash character (U+2014) anywhere.** Not in UI copy, not in
blog posts, not in data files, not in metadata, not in code comments. It is the
single most obvious tell of machine-written text and it does not match how
Niraj writes. The en-dash (U+2013) is out for the same reason.

A plain ASCII hyphen `-` is the only dash allowed.

Rewrite instead of substituting:

| Situation | Write |
| --- | --- |
| Aside or parenthetical | Use commas, or split into two sentences |
| Label and value | Use a colon: `Stack: Next.js, Postgres` |
| Title and subtitle | Use a comma, or a middot `·` |
| Date range | `2025 - Present` with a plain hyphen |

Verify before finishing:

```sh
grep -rn $'—\|–' src/ content/ CLAUDE.md   # must return nothing
```

Careful with bulk find-and-replace: a regex like `\s+—\s+` matches across
newlines and will collapse two lines of a block comment into one.

Keep an eye on the other machine-writing tells too: "it's not just X, it's Y",
"delve", "in today's fast-paced world", and paragraphs that open with "Whether
you're...". Write plainly.

### Voice

First person, direct, specific. Concrete numbers over adjectives. If a claim
cannot be backed by something that shipped, cut it.

## Design rules

### No hard colours

The palette is strictly achromatic: `background`, `foreground`,
`muted-foreground`, `border`, `card`. Every CSS token in `globals.css` is 0%
saturation apart from `--destructive`.

**Never introduce blue, purple, indigo, violet, cyan, or any vendor brand
colour**, including in tech-stack icons, charts, or hover states. Hierarchy
comes from contrast, weight, and spacing.

### Contrast

Body copy uses `text-muted-foreground`, which is deliberately tuned to stay
legible in both themes. Do not drop below it (no `text-muted-foreground/60` for
anything a reader has to read). Decorative marks and separators may go lighter.

### Layout

- The layout centres every route at `max-w-7xl`. Post pages use it as is.
- The root profile pulls itself in to `max-w-5xl` on its own `<main>`, because
  it reads as one column. Narrow it there, not in the layout, or the post pages
  come with it.
- The footer and the floating dock are `max-w-5xl` too, so they line up with the
  profile rather than with the wider post pages. The dock's backdrop gradient
  stays full width: it is a page-bottom fade, not part of the column.
- Prose column inside a post is capped separately so line length stays readable.
- The contents rail on a post is sticky and scrolls inside a `ScrollArea`, so a
  post with thirty headings cannot run off the bottom of the screen.
- Section headers all use `<SectionHeading>`. Do not hand-roll one.

## Theme switching

The toggle animates with the **View Transitions API**, not CSS transitions. The
provider runs with `disableTransitionOnChange`, which kills CSS transitions at
the moment of the switch so the page does not slow-fade on load, and that also
means a `transition: background` can never animate a theme change.

`startThemeTransition()` in `components/theme-provider.tsx` is the entry point.
A click passes its coordinates, which selects a directional wipe: left to right
going dark, right to left coming back. A programmatic switch passes nothing and
cross-fades instead.

Four things are load-bearing. Each one was a visible bug before it was fixed:

- **`flushSync` is mandatory.** React batches, so without it the class lands
  after the browser has taken its "after" snapshot and nothing animates.
- **The clip is a CSS keyframe, not `.animate()` after `ready`.** The `.animate()`
  route leaves one unclipped frame where the new theme paints full screen.
- **`mix-blend-mode: normal` on both snapshots.** The UA default is
  `plus-lighter`, which adds their colours inside the revealed strip and flashes
  bright, worst going dark to light.
- **`backdrop-filter` cannot be snapshotted.** Blurred surfaces render live over
  both snapshots and hard-flash. The CSS strips blur for the duration; tag any
  translucent surface `theme-vt-glass` so it falls back to a solid background.

## Hiding a project

Set `hidden: true` on the entry in `resume.tsx` and read through
`VISIBLE_PROJECTS`, never `DATA.projects`. The entry, its links and its copy all
stay put, so switching it back on is one deleted line.

Filtering in one place keeps the page, the JSON-LD and `llms.txt` in agreement.
A project hidden on screen but still listed in structured data is worse than
either, because search results then surface something the site will not show.

## Content

Posts are MDX in `content/`. Frontmatter:

```yaml
title: string           # required
publishedAt: YYYY-MM-DD # required
summary: string         # required, used for meta description and cards
art: string             # optional, which animated SVG illustrates the post
category: string        # optional, broad grouping. Lowercase slug: "databases"
kind: string            # optional, shape of the piece: essay | tutorial | note
tags: [string]          # optional
featured: boolean       # optional, pins to top of /blogs
draft: boolean          # optional, hidden in production
image: /path.webp       # optional, overrides the generated social card only
```

Categories are stored lowercase and rendered in title case. `databases` in
frontmatter and in the `posts.category` column, "Databases" on screen. The
spellings live in `src/lib/categories.ts`, same idea as `src/lib/tags.ts`, so
grouping never splits because one post capitalised the word and another did
not. Both `blog.ts` and `blog-sync.mjs` lowercase on the way in.

Post URLs live at the **root**: `content/hello.mdx` serves at `/hello`. The
index is `/blogs`. When adding a root-level route (e.g. `/about`), make sure no
post slug collides with it. Old paths (`/blog`, `/notes`, `/blog/<slug>`) are
permanently redirected in `next.config.mjs`; add a redirect rather than
breaking a URL that is already public.

### Outbound links are mandatory

**Every post links out generously, and every link is verified before it ships.**

A post that names a tool, a company, a paper, a spec, or a repo and does not
link it is worse than useless: the reader has to go and search for the thing
you already knew the URL of. If you mention it, link it.

What to link:

- Every product, employer, and project named (`Creatr`, `SyncHq`, `xAGI`, ...)
- Every library, database, or service (`Next.js`, `pgvector`, `Resend`, ...)
- The **primary source** for any technique or claim: the spec, the docs page,
  the paper. Not a blog post about the paper.
- Your own repos and live deployments, so a reader can go and look

**Verify before publishing. Always:**

```sh
pnpm links:check          # every post plus the profile's project links
pnpm links:check hello    # one post
```

It exits non-zero if anything is broken, so it can gate a deploy. The checker
tries HEAD, retries with GET (GitHub answers 405 to HEAD), and sends a browser
User-Agent. It classifies results three ways:

| Result | Meaning |
| --- | --- |
| `ok` | Resolves. A `->` line means it redirected, use the final URL instead |
| `bot` | 401/403/999. The page exists but blocks scripts. LinkedIn and Atera do this. Fine to ship |
| `FAIL` | Genuinely broken. Fix it or remove it |

Two rules learned the hard way:

1. **Never link a repo from memory.** `github.com/jha-niraj/Gurukul` sat in the
   portfolio as a 404 because the repo is private. `coderzofficial` silently
   became `buildrhqofficial`. Probe the URL, then write it.
2. **Follow redirects into the canonical URL.** If the checker prints a `->`
   line, put the destination in the markdown. A redirect chain is a small tax
   on every reader and leaks a little ranking signal.

`resume.tsx` project links are checked too, because a dead link on a portfolio
is the one nobody ever re-clicks.

### Post artwork, not photographs

Posts do not use cover images. Each one gets an **animated SVG** from
`src/components/post-art.tsx`, chosen with `art:` in frontmatter:

| `art:` | Depicts |
| --- | --- |
| `pipeline` | Stages with a token flowing through, branching to human review |
| `retrieval` | A document shedding chunks that converge into one answer |
| `schema` | Entity boxes with relations drawing themselves |
| `network` | Nodes with links firing between them |
| `terminal` | A window with lines typing themselves out |
| `backfill` | A table gaining a column, filled one batch at a time by a sweeping window |

Pick the one that depicts what the post is actually about. Omitting `art:`
hashes the slug to a stable choice, so it never looks random or changes between
renders.

Adding a piece: write the SVG component in `post-art.tsx`, register it in the
`ART` map, and put its keyframes in the "Post artwork" block at the bottom of
`globals.css`. Rules for a new piece:

- Pure SVG plus CSS. No client JS, no images, no `<img>`.
- `currentColor` only, so it works in both themes. No fills with literal colours.
- Every animation **must** be switched off in the `prefers-reduced-motion`
  block and given a sensible static pose there. An animation that simply
  vanishes under reduced motion is a bug.
- Stagger with `--i` on the element and `calc(var(--i) * Ns)` in the delay.

## Newsletter: how a post becomes an email

Posts are static MDX. Nothing in the database knows a file exists, so nothing
can answer "which posts have not been emailed yet?". The `posts` table is the
bridge, and the pipeline has exactly three moving parts.

```
                  content/hello.mdx
                  (title, summary, category, kind, tags, publishedAt)
                          |
                          |  pnpm blog:sync        <- automatic, runs on postbuild
                          v
                  posts table  ................  one row per file
                    slug, title, summary,
                    category, kind, tags,
                    content_hash              <- detects edits
                    broadcast_id              <- null until emailed
                    broadcast_sent_at         <- null until emailed
                    broadcast_skipped         <- true = never email this one
                          |
                          |  pnpm blog:broadcast   <- manual, dry run by default
                          |  SELECT ... WHERE broadcast_sent_at IS NULL
                          |               AND broadcast_skipped = false
                          |               AND draft = false
                          |               AND published_at <= today
                          v
                  resend.broadcasts.create({ segmentId, from, subject, html, send: true })
                          |
                          v
                  Resend segment "nirajjha.in"
                    <- subscribers land here from the site's subscribe form
                          |
                          v
                     subscriber inboxes
                          |
                          v
                  UPDATE posts SET broadcast_id, broadcast_sent_at
                    <- the row is now ineligible, so a rerun cannot double-send
```

### Publishing a new post

1. Write `content/my-post.mdx` with `title`, `summary`, `publishedAt`,
   `category`, `kind`, `tags`, `art`.
2. Deploy. `postbuild` runs `blog:sync`, which inserts the row with
   `broadcast_sent_at` null.
3. `pnpm blog:broadcast` to preview: it prints the subject, URL and recipient
   count and sends nothing.
4. `pnpm blog:broadcast --send` when the preview looks right.

### Why broadcast is manual

Sending to a list is irreversible. If it ran automatically on deploy, a typo
fix that touched frontmatter, a rollback, or a preview deploy could mail the
list. Sync is idempotent and safe to automate; sending is not, so the
destructive path has to be typed every time.

Useful flags: `--slug=hello` targets one post, `--draft` creates the broadcast
in Resend without sending so you can read it in their UI, `--schedule="in 1
hour"` defers delivery.

### Not mailing the archive

`pnpm blog:sync --mark-sent` stamps every un-emailed post as
`broadcast_skipped`. Run it once before the first real broadcast so old posts
are not sent out in a batch.

### Subscribe path

The subscribe action writes to the `subscribers` table **before** calling
Resend, so an outage during signup never loses the address: the row lands with
`synced_at` null and can be pushed later. The reader is told they are on the
list either way, because from their side they are.

## Visitor identity

There are no accounts. Likes, dislikes and comment ownership hang off an
anonymous UUID in the `nj_vid` cookie, minted by `src/proxy.ts` (the file Next
15 and earlier called `middleware.ts`).

It is a discouragement, not authentication. Clearing cookies makes you a new
visitor, and the only thing that buys anyone is another vote.

**Never identify visitors by user agent or IP.** A user agent string is shared
by millions of people at once, so keying on it would show "you already liked
this" to every other visitor on the same browser version. IP is barely better
under CGNAT, and it is personal data this site otherwise never touches.

Three rules keep this working:

- **Server actions read the id from the cookie, never from an argument.** They
  used to take a `visitorId` parameter, which meant anyone who observed an id
  could delete that person's comments by passing it. Use `getVisitorId()` from
  `lib/visitor-server.ts`.
- **Never call `cookies()` during a page render.** It marks the whole route
  dynamic, which drops every post out of static generation and off the CDN.
  Actions and route handlers only.
- **Per-visitor state cannot be server-rendered.** Post pages are prerendered
  and the HTML is shared by everyone. "You liked this" is painted from the
  `nj.reactions` localStorage cache on the first client render, then replaced by
  the server's answer. That cache is display only and never a source of truth.

`lib/visitor.ts` promotes a pre-cookie `nj.visitor` localStorage id into the
cookie when it finds one, so readers who reacted before this existed keep their
history. Do not remove that until it has been deployed long enough not to matter.

## Data

`src/data/resume.tsx` is the single source of truth for the profile. Metadata,
JSON-LD, `llms.txt`, and the RSS feed all derive from it. Change it there, not
in the components.

## SEO

Every route ships JSON-LD from `src/lib/schema.ts`. When adding a route, add it
to `sitemap.ts` and, if it is content, to `feed.xml` and `llms.txt`. The Person
node must be re-emitted in each page's graph so `author`/`publisher` `@id`
references resolve locally.
