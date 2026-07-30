# Blog standard

Every post is checked against this file before it ships:

```sh
pnpm blog:lint            # all posts
pnpm blog:lint my-post    # one post
```

The linter enforces the mechanical rules in **Part 2**. The editorial rules in
**Part 1** are a checklist you read and confirm; no script can tell you whether
a paragraph is actually clear.

---

## Part 1: shape (read this before writing a word)

A post is not a document dump. It is one question, answered in order.

### The required arc

**1. Open on the problem, as a scene.**
Not "in this post we will explore". Put the reader in the moment the problem
shows up: the interview question, the alert at 3am, the pull request that got
rejected. Concrete, and under 120 words.

**2. Say plainly what this actually is.**
One short section, immediately after the hook, that explains the subject to
somebody who has never met it. Rules for this section:

- No jargon that has not been defined one sentence earlier.
- One analogy to something physical and ordinary.
- If a smart fifteen-year-old could not follow it, rewrite it.

This is the section people skip when writing and the section people need most.

**3. Say why it matters.**
What breaks. Who notices. What it costs. Two or three sentences.

**4. Tell it in order.**
The story runs forwards: what you tried, what happened, what you learned. Each
section moves the reader one step. If a section could be cut without the reader
getting lost, cut it.

**5. Land the answer.**
The thing to actually do, stated once, plainly.

**6. Close with the short version.**
A recap for people who skimmed. Bullets, no new information.

### Voice

- Second person for the reader, first person for yourself.
- Short sentences. If a sentence needs a comma to survive, split it.
- Concrete numbers over adjectives. "250 million rows", not "a huge table".
- Cut every sentence that only restates the previous one.
- No em-dashes. See CLAUDE.md.

### Before you publish, confirm by hand

- [ ] The first 120 words describe a problem, not a topic.
- [ ] There is a section that explains the subject in plain language, early.
- [ ] That section contains an analogy to something ordinary.
- [ ] Every jargon term is defined the first time it appears.
- [ ] The sections are in causal order, not encyclopedic order.
- [ ] Nothing in the post is there only because it was interesting to write.
- [ ] The recap at the end introduces nothing new.

---

## Part 2: limits (the linter enforces these)

| Rule | Limit | Why |
| --- | --- | --- |
| Word count | 900 to 2,000 | Under 900 is a note, over 2,000 stops being read |
| Reading time | 4 to 10 minutes | Same rule, stated the way the reader sees it |
| Headings (h2 + h3) | 12 max | More than twelve means the post is two posts |
| h3 under one h2 | 5 max | A section that needs six subsections is a section too big |
| Intro before first h2 | 200 words max | The hook, not a preamble |
| Code blocks | 6 max | A post is prose with code in it, not code with prose in it |
| Lines per code block | 25 max | Longer belongs in a repo you link to |
| Paragraph length | 5 sentences max | |
| Summary (frontmatter) | 80 to 200 characters | Doubles as the meta description |
| Outbound links | 5 min | See the outbound-link rules in CLAUDE.md |
| Em-dashes | 0 | |

Frontmatter must carry: `title`, `publishedAt`, `summary`, `category`, `kind`,
`tags`, `art`.

### Failing the linter

`pnpm blog:lint` exits non-zero on any breach, so it can gate a deploy. If a
post genuinely needs to break a limit, the honest fix is usually to split it
into two posts, not to raise the limit.
