# Next.js series: the confusing parts

Not tutorials. Every post here exists because the documented behaviour and the
behaviour people expect are different, and the gap costs somebody a day.

The test for whether a topic belongs on this list: **someone competent could
read the official docs, do exactly what they say, and still get it wrong.** If
the docs make it obvious, it is not a post.

- Category: `nextjs` (displays as "Next.js")
- Tags: `Next.js`, plus `Performance` or `Interviews` where they apply
- Kind: `essay` for the story-led ones, `note` for the short sharp ones

---

## The story shape every post uses

Six beats. This is the same arc as `docs/blog-standard.md`, with the two beats
that make it interview-grade rather than a tutorial marked.

1. **The symptom, as a scene.** Under 120 words, one real number. Not "let's
   explore prefetching" but "the list page went from 400ms to four seconds the
   day we made the rows clickable."
2. **The fix that made it worse.** ← *this is the hook.* What a competent person
   tries first, why it is reasonable, and why it backfires. Most posts skip
   this. It is the only part a reader has personally lived through.
3. **What is actually happening.** The mechanism, in plain words, with one
   analogy to something ordinary. No API surface yet.
4. **The one sentence that makes it permanent.** The mental model, stated once
   and stated plainly. If a reader remembers a single line six months later,
   this is the line.
5. **The decision rule.** A test they can apply on Monday without re-reading the
   post. Bounded vs unbounded. Instant vs deferred. One question, two branches.
6. **Where the fix stops working.** ← *this is what makes it interview-grade.*
   The boundary. Knowing prefetch tuning cannot fix a cold serverless start is
   the difference between someone who read a blog post and someone who has
   debugged this.

**Why beat 2 and beat 6 matter most:** anyone can explain what `prefetch` does.
Beat 2 proves you have shipped it. Beat 6 proves you know its limits. Those are
the two things an interviewer is actually listening for, and they are exactly
what a tutorial leaves out.

---

## Phase 1: navigation and data, the two guides already written

Source: `guide-navigation-prefetch-and-db-perf.md`,
`guide-safe-actions-and-useaction.md`

### 1. The prefetch that made the list page slower

The flagship. `<Link>` vs `router.push`, the three settings of `prefetch`, and
why the default is not `true`.

- **Scene:** rows became `<Link>`s, navigation got instant, the list page got
  slow. Both are true and both are caused by the same change.
- **Worse fix:** adding `prefetch={true}` because "prefetching is the fast
  thing". Twenty rows in the viewport, twenty full page renders, twenty queries.
- **Mechanism:** a prefetch is a background request for the route's RSC payload.
  For a dynamic route the server renders down to the nearest `loading.tsx` and
  *stops*. The dynamic body never runs. That is a server refusing to execute
  code for a page you have not opened, not a client guessing.
- **The line:** default prefetch fetches the *shape* of the page; `prefetch`
  fetches the *page*.
- **Rule:** could this set hold "100 more, suddenly"? Yes means default. No, a
  fixed nav or dashboard, means `prefetch` is on the table.
- **Boundary:** the skeleton hides latency, it does not remove it. If a 2kB
  response takes seconds, that is cold start or DB wake, and no amount of
  prefetch tuning touches it.

Tags: `Next.js`, `Performance`, `Interviews`. Art: `pipeline`.

### 2. Three layers people call "a server action"

Raw action vs safe action vs `useAction`, and why conflating them makes the
codebase inconsistent.

- **Scene:** two mutations in the same codebase, written three different ways,
  one of them skipping validation entirely.
- **Worse fix:** wrapping everything in `try/catch` because actions "throw".
- **Mechanism:** the three stacked things. `'use server'` function, the
  validation and middleware wrapper returning a discriminated union, and the
  client hook that consumes it.
- **The line:** `useAction` is not a way to *define* an action, it is a way to
  *consume* one.
- **Rule:** one auth-wrapped client, every mutation through it, consumed with
  the hook.
- **Boundary:** the wrapper is ergonomics and validation. It is not
  authorisation. The server still has to check who is calling.

Tags: `Next.js`, `Interviews`. Art: `pipeline`.

### 3. The pending flag that lags one frame behind the click

`isPending` vs `status === 'executing'`, and the `useTransition` underneath.

- **Scene:** the button feels dead for a moment after a click, so somebody adds
  a `useState` to fake instant feedback.
- **Worse fix:** that exact `useState`, plus an `onSettled` to reset it.
- **Mechanism:** `status` is set *inside* the transition callback, so React can
  defer it. `isTransitioning` is set synchronously at call time.
  `isPending = isExecuting || isTransitioning`.
- **The line:** the manual flag was hand-rolling `isTransitioning`, badly.
- **Rule:** drive loading state off `isPending`. Never add a manual pending
  `useState`.
- **Boundary:** `isPending` is about *this* transition. It says nothing about
  whether the server finished its side effects.

Tags: `Next.js`, `Performance`. Art: `terminal`.

### 4. Why your loading.tsx never showed up

The Suspense boundary people think they have and the one they actually have.

- **Scene:** a skeleton written, styled, and never once seen on screen.
- **Mechanism:** `loading.tsx` only fires when the segment suspends *on a
  transition*. An `await` above the boundary, a fully static route, or a client
  fetch in `useEffect` all mean it never triggers.
- **The line:** `loading.tsx` is a `<Suspense>` around the segment, nothing more.
- **Boundary:** it is per segment. Fine-grained skeletons need `<Suspense>` in
  the page.

Tags: `Next.js`, `Performance`. Art: `pipeline`.

---

## Phase 2: the rendering model

### 5. "use client" does not mean what you think

It marks an entry point into the client module graph, not a subtree. Children
passed as props stay on the server. This is the single most misread directive in
the framework, and the reason people believe you cannot put a server component
inside a client component. You can. You just cannot *import* one.

Tags: `Next.js`, `Interviews`. Art: `network`.

### 6. The line that quietly dropped your whole site off the CDN

One `cookies()` call in a layout makes every route under it dynamic. No error,
no warning, just a build that used to be static and now is not. Includes how to
find it in the build output. *This site hit exactly this.*

Tags: `Next.js`, `Performance`. Art: `backfill`.

### 7. Four caches, and the one that bit you is the one you forgot

Request memoization, Data Cache, Full Route Cache, Router Cache. Which layer
`revalidatePath`, `revalidateTag` and `router.refresh()` each hit, what Next 15
changed about the defaults, and why "I revalidated and it is still stale" almost
always means the right call on the wrong layer.

Tags: `Next.js`, `Interviews`. Art: `retrieval`.

### 8. Server actions are public POST endpoints

They look like function calls, so people trust their arguments. Anyone can call
one with any payload. The visitor-id example: an action that took an id as a
parameter let anyone act as anyone. Read identity from the cookie on the server,
never from an argument. *This site's own bug.*

Tags: `Next.js`, `Interviews`. Art: `network`.

### 9. redirect() and notFound() work by throwing

Which means a `try/catch` around them swallows the redirect, and code after them
never runs. Control flow through exceptions, and where it surprises people.

Tags: `Next.js`. Art: `terminal`.

### 10. generateStaticParams, dynamicParams, revalidate: the matrix

Six combinations, three of which people reach for by accident. What actually
gets built, what gets rendered on demand, and what 404s.

Tags: `Next.js`, `Performance`. Art: `schema`.

---

## Phase 3: the build

### 11. One import dragged a megabyte into your client bundle

Module boundaries are transitive. Importing a util that happens to import your
markdown renderer puts the renderer in the bundle. How to find it, and the
`server-only` package as a tripwire. *This site hit this with shiki and Terser.*

Tags: `Next.js`, `Performance`. Art: `network`.

### 12. next/font fails silently and ships Arial

The Google loader fetches at build time. When the fetch fails it warns and ships
the fallback rather than failing the build, so a green deploy can be wrong.
`localFont` has the same API and no network dependency. *This site shipped Inter
as Arial for a week.*

Tags: `Next.js`. Art: `terminal`.

### 13. Metadata merges, it does not replace

Set `openGraph.url` in the root layout and every child page inherits it, so
every share previews as the homepage. Plus the 404 that emitted two
contradictory robots tags. *Both were bugs on this site.*

Tags: `Next.js`. Art: `schema`.

### 14. The build warning that meant your whole repo was a dependency

`path.join(process.cwd(), SOME_CONSTANT)` is opaque to the bundler's static
analysis, so it traces everything. The fix is a string literal. Why "it still
works" is not the same as "it is fine". *This site hit this.*

Tags: `Next.js`. Art: `backfill`.

---

## Phase 4: the parts with no good explainer yet

### 15. Route handlers or server actions?

Both are POST endpoints. The real dividing lines: who calls it, whether you need
the response body, caching, and whether a third party has to reach it.

### 16. useTransition, useOptimistic, useFormStatus

Three hooks that all make a button feel fast, solving different problems.

### 17. Parallel and intercepting routes

The two features with the highest concept-to-payoff ratio. When the modal
pattern is worth it and when it is a folder structure nobody can read.

### 18. Partial Prerendering

Static shell, dynamic holes, one request. What it replaces and what it does not.

### 19. Middleware runs on every request

Including static assets if the matcher is wrong. Edge runtime constraints, and
why it cannot be the authorisation check. *This site's `proxy.ts` says so in a
comment.*

### 20. The streaming that never streamed

Buffering proxies, `X-Accel-Buffering`, and why a stream that works locally
arrives all at once in production.

---

## Publishing order

Ship 1 to 4 first: they are the two guides already written, they are the most
searched, and they set the series voice. Then 5 to 8, which are the interview
questions. Then the build posts, which are strongest because every one of them
is a bug this site actually had, with a commit to point at.

One post per working day is not the constraint. **Nine hundred words that
survive an interviewer's follow-up beats two thousand that do not.**
