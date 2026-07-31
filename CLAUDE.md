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
pnpm dev          # dev server, shows only live posts
pnpm dev:drafts   # dev server, unpublished posts visible too
pnpm build        # production build
pnpm lint
pnpm typecheck
pnpm icons        # regenerate favicons + hero portrait from public/nirajjha.jpeg
pnpm db:generate  # write a SQL migration from schema changes
pnpm db:migrate   # apply pending migrations to DATABASE_URL
pnpm db:studio    # browse the data
pnpm resend:setup # create/find the newsletter segment, print its id
pnpm blog:sync    # mirror MDX frontmatter into the posts table (MANUAL, see below)
pnpm blog:broadcast          # DRY RUN: show what would be emailed
pnpm blog:broadcast --send   # actually send
pnpm links:check  # verify every outbound link in content/ and resume.tsx
pnpm apply:list   # contributor applications awaiting review
pnpm apply:show <email>
pnpm apply:decide <email> invited|declined "reason"
pnpm blog:lint    # check posts against docs/blog-standard.md
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

### Typography

Two faces, and the split is deliberate:

| Variable | Face | Used for |
| --- | --- | --- |
| `--font-sans` | Inter | Everything. Body, UI, nav, every `h2`/`h3` inside a post |
| `--font-display` | Bricolage Grotesque | The single biggest heading on a page, and nothing else |
| `--font-wordmark` | Instrument Serif | The footer wordmark only |

Apply the display face with the `.display-heading` class from `globals.css`, not
by reaching for `font-display` inline, so the tracking and optical size travel
with it. Add `.display-heading-xl` on genuinely large text (the root hero, the
portfolio name), which pushes the optical-size axis up and tightens tracking
further.

**Only the page's `h1` gets it.** Not section headers, not headings inside an
article, not the admin chrome. A display face is a signal, and a signal applied
to everything is noise. The class carries `font-weight: 600` and its own
`letter-spacing`, so drop any `font-semibold` / `tracking-tight` next to it
rather than leaving a utility that silently loses.

All three are **self-hosted** through `next/font/local` from `src/app/fonts/`,
not `next/font/google`. The Google loader fetches at build time and, when that
fetch fails, does not fail the build: it warns and ships the fallback, which is
exactly how Inter shipped as Arial once. `localFont` has the same API and the
same `--font-*` variable output with no network dependency. To add a face,
download the `latin` woff2 from the Google CSS and drop it in `src/app/fonts/`.

Bricolage is variable on two axes (`opsz` 12-96, `wght` 200-800), which is why
`font-variation-settings: "opsz"` appears in the class: a 48px title gets
letterforms drawn for 48px rather than a 16px master scaled up.

### Contrast

Two levels of secondary text, and the split matters:

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--prose-foreground` | 24% | 88% | Article body and blockquotes |
| `--muted-foreground` | 30% | 76% | UI chrome: labels, captions, nav, meta |

Long-form prose is the content, not chrome around it, so it gets its own token
and sits closer to `--foreground`. At 76% in dark mode the body sat far enough
below the 96% used for headings, links and bold that every emphasised word made
the plain text look grey by comparison. The ratios were never the problem: 76%
on a 4% background is already 11:1. The gap was.

Do not drop below `--muted-foreground` for anything a reader has to read (no
`text-muted-foreground/60` for real text). Decorative marks and separators may
go lighter.

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
live: boolean           # REQUIRED. false or absent means not published
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

### Author notes in a post

`{/* ... */}` is stripped by `stripAuthorComments` in `src/lib/author-comments.ts`
before anything reads the body, so it never reaches the page, `/<slug>.md` or
`llms-full.txt`.

**That stripping is the only reason the syntax works.** Posts are named `.mdx`
but nothing compiles MDX: the pipeline is plain markdown (remark-parse,
remark-gfm, remark-rehype). MDX would treat `{/* ... */}` as a JSX expression
and drop it. remark sees ordinary characters and renders them as prose, which is
exactly what happened: a note parking two projects was published in full, on the
page and in both machine-readable sources.

`getPost` strips once, at read time, so the HTML, the reading time and the
contents rail all derive from the same text. Stripping only in the renderer left
a parked section inflating the reading estimate.

`scripts/blog-lint.mjs` does the same in `proseOnly()`, which is why the word
counts always looked right while the text was going out. A linter agreeing with
you is not the same as the site agreeing with you.

### Every post follows docs/blog-standard.md

**Read [docs/blog-standard.md](docs/blog-standard.md) before writing or editing
any post.** It is the contract for what a post has to be, and `pnpm blog:lint`
enforces the measurable half of it. A post that does not pass does not ship.

The shape it requires, in order:

1. **Open on the problem as a scene**, under 120 words. Not "in this post".
2. **Explain plainly what the thing actually is**, early, with one analogy to
   something ordinary. This is the section that gets skipped when writing and
   needed most when reading.
3. **Say why it matters**: what breaks, who notices.
4. **Tell it in causal order**, not encyclopedic order.
5. **Land the answer** once, plainly.
6. **Close with a recap** that introduces nothing new.

The hard limits: 900 to 2,000 words, 4 to 10 minutes, 12 headings, 6 code
blocks of 25 lines each, 5 sentences per paragraph, an 80 to 200 character
summary, at least 5 outbound links.

If a post genuinely cannot fit, it is two posts. Raising a limit is almost
never the right fix.

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

### The 404

`src/app/not-found.tsx` and `src/app/(site)/not-found.tsx` both render
`<NotFoundView>`. Two boundaries are needed and they are not redundant:

- `(site)/not-found.tsx` catches `notFound()` thrown by the post route, which is
  where nearly every real 404 arrives, because any single-segment URL matches
  `[slug]` first. It is inside the group, so it gets the header, footer and dock
  for free.
- `not-found.tsx` at the root catches anything deeper (`/a/b/c`). A root
  not-found renders in `app/layout.tsx` only, because route group layouts do not
  apply to it, so it wraps `<SiteShell>` by hand. Without that, deep 404s render
  as bare text.

The artwork follows the same rules as the post art: pure SVG plus keyframes in
globals.css, `currentColor` only, and a static pose under
`prefers-reduced-motion` (the probe parks at the gap rather than disappearing).

**Keep the `robots` override in the root not-found.** The root layout declares
`index: true` for real pages and metadata merges down, so removing it ships two
contradictory robots tags: Next's automatic `noindex` beside the layout's
`index, follow`. Crawlers take the strictest reading, but do not publish a
contradiction and lean on the tie-break.

The page lists real recent posts. A 404 that only apologises wastes the one
moment someone is definitely looking for something.

## Machine-readable text: llms.txt and llms-full.txt

Two files, and the split is the point:

| Route | What it is | For |
| --- | --- | --- |
| `/llms.txt` | An index. Every post as one `- [Title](url): summary` line, linked to its `.md` | An agent that wants one post, cheaply |
| `/llms-full.txt` | The corpus. Every post inlined in full, plus the profile | A crawler that wants the whole site in one request |
| `/<slug>.md` | One post's markdown source, via the rewrite in `next.config.mjs` | What the index links to |

Publishing only the index forces a whole-site reader into N requests.
Publishing only the full text makes a one-question reader pay for everything.

`llms-full.txt` inlines the MDX source, not rendered HTML, and **demotes every
heading in a post by one level** so the document stays a real tree: posts are
`##`, so a post's own `##` sections become `###`. Without that, nothing marks
where one post ends. The demotion tracks fenced blocks and skips them, because
a `# comment` at the start of a shell line is not a heading.

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
                          |               AND live = true
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

Posts are written ahead and released one at a time. `live` is the switch, and
`blog.ts` filters on it in every environment. An unpublished post is not built as
a route, so its URL 404s rather than being merely unlinked, and it stays out of
the sitemap, the feed, `llms.txt`, `llms-full.txt` and the `.md` sources.

**`pnpm dev` shows exactly what production shows.** It used to key the filter off
`NODE_ENV === "development"`, so the dev server listed every unpublished post and
the local site never matched the deployed one. A preview mode that is always on
is not a preview mode. To proofread before publishing:

```sh
pnpm dev:drafts   # SHOW_UNPUBLISHED=1, lists and serves unpublished posts too
```

**Publishing is opt in.** A post with no `live: true` is invisible. This replaced
a `draft` flag that defaulted to published, where forgetting the flag shipped the
post; forgetting `live` only hides one, which is the recoverable direction.
`blog:lint` requires the key, so it cannot be left off by accident.

**A future `publishedAt` does not hide anything.** There is no date filter on the
site, only on the broadcast query. Date-stamp a post next month with
`live: true` and it goes live now, just sorted to the top. `live` is the only
switch.

1. Write `content/my-post.mdx` with `title`, `summary`, `publishedAt`,
   `category`, `kind`, `tags`, `art`, and `live: false`.
2. On the day it goes out: `pnpm blog:publish my-post`. That flips the flag,
   then runs `blog:lint` and `links:check`, and **puts the flag back if either
   fails**, so a post cannot go live broken by forgetting to check.
3. `pnpm blog:sync` to insert the row with `broadcast_sent_at` null.
4. Deploy.
4. `pnpm blog:broadcast` to preview: it prints the subject, URL and recipient
   count and sends nothing.
5. `pnpm blog:broadcast --send` when the preview looks right.

**Sync is manual, not a `postbuild` hook.** It used to run on every build, which
meant every preview deploy, every rollback and every CI run wrote to the
production database for no reason. A post is not published by being built, it is
published by you deciding it is, so the write happens when you say so.

The cost of that choice: a post that has not been synced is invisible to
`blog:broadcast` and to the admin analytics, because both read the `posts`
table rather than the filesystem. If a new post is missing from `/admin/blogs`,
`blog:sync` is what you forgot.

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

## Reading files at runtime

Anything that touches the content directory must go through
`src/lib/content-path.ts`, which holds the only `path.join(process.cwd(),
"content")` in the codebase.

The directory name has to be a **string literal inside the join**. Passing an
imported constant makes the path opaque to Turbopack's static analysis: it
cannot tell which subtree is being read, so it traces the whole project and the
build warns "Encountered unexpected file in NFT list". Nothing breaks, but every
file in the repo becomes a traced dependency of the routes that read a post.

## Data

`src/data/resume.tsx` is the single source of truth for the profile. Metadata,
JSON-LD, `llms.txt`, and the RSS feed all derive from it. Change it there, not
in the components.

## SEO

Every route ships JSON-LD from `src/lib/schema.ts`. When adding a route, add it
to `sitemap.ts` and, if it is content, to `feed.xml` and `llms.txt`. The Person
node must be re-emitted in each page's graph so `author`/`publisher` `@id`
references resolve locally.
